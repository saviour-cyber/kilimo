import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, organizations, farms, iotDevices, platformModules, platformServices, auditLogs, iotGateways, generatedReports, platformAnnouncements, platformEmailLogs } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sql, count, eq, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { emailService } from "../services/email";

export const adminRouter = router({
  // ── Dashboard Stats ────────────────────────────────────────────────────────
  getPlatformStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [usersCount] = await db.select({ value: count() }).from(users);
    const [orgsCount] = await db.select({ value: count() }).from(organizations);
    const [farmsCount] = await db.select({ value: count() }).from(farms);
    const [devicesCount] = await db.select({ value: count() }).from(iotDevices);

    return {
      totalUsers: usersCount.value,
      totalOrganizations: orgsCount.value,
      activeFarms: farmsCount.value,
      onlineDevices: devicesCount.value,
      // Mocks for now until billing/AI models are fully implemented
      monthlyRevenue: 4200000,
      apiRequestsToday: 1200000,
      aiRequestsToday: 18000,
      storageUsedTb: 2.1,
    };
  }),

  // ── Users ──────────────────────────────────────────────────────────────────
  listUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        lastSignedIn: users.lastSignedIn,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);
  }),

  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.userId === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot remove your own admin role." });
      }

      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "USER_ROLE_UPDATED",
        entityType: "user",
        description: `Updated role for user ${input.userId} to ${input.role}`,
        metadata: { newRole: input.role },
      });

      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot delete your own account." });
      }

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "USER_DELETED",
        entityType: "user",
        description: `Deleted user ${input.userId}`,
        metadata: {},
      });

      await db.delete(users).where(eq(users.id, input.userId));

      return { success: true };
    }),

  // ── Organizations ──────────────────────────────────────────────────────────
  listOrganizations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select({
        id: organizations.id,
        name: organizations.name,
        businessType: organizations.businessType,
        country: organizations.country,
        contactEmail: organizations.contactEmail,
        contactPhone: organizations.contactPhone,
        ownerId: organizations.ownerId,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .orderBy(organizations.createdAt);
  }),

  createOrganization: adminProcedure
    .input(z.object({
      name: z.string().min(2),
      businessType: z.string().min(1),
      country: z.string().default("Kenya"),
      county: z.string().optional(),
      contactEmail: z.string().email().optional().or(z.literal("")),
      contactPhone: z.string().optional(),
      description: z.string().optional(),
      ownerId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [result] = await db.insert(organizations).values({
        name: input.name,
        businessType: input.businessType,
        country: input.country,
        county: input.county,
        contactEmail: input.contactEmail || undefined,
        contactPhone: input.contactPhone,
        description: input.description,
        ownerId: input.ownerId,
      });

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "ORGANIZATION_CREATED",
        entityType: "organization",
        description: `Created organization: ${input.name}`,
        metadata: { name: input.name, businessType: input.businessType },
      });

      return { success: true, id: result.insertId };
    }),

  deleteOrganization: adminProcedure
    .input(z.object({ organizationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "ORGANIZATION_DELETED",
        entityType: "organization",
        description: `Deleted organization ${input.organizationId}`,
        metadata: {},
      });

      await db.delete(organizations).where(eq(organizations.id, input.organizationId));

      return { success: true };
    }),

  // ── Modules ────────────────────────────────────────────────────────────────
  listModules: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db.select().from(platformModules).orderBy(platformModules.sortOrder);
  }),

  toggleModule: adminProcedure
    .input(z.object({ id: z.string(), isEnabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(platformModules)
        .set({ isEnabled: input.isEnabled })
        .where(eq(platformModules.id, input.id));

      // Audit Log
      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "MODULE_TOGGLE",
        entityType: "module",
        description: `Toggled module ${input.id} to ${input.isEnabled}`,
        metadata: { isEnabled: input.isEnabled },
      });

      return { success: true };
    }),

  // ── Services ───────────────────────────────────────────────────────────────
  listServices: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db.select().from(platformServices).orderBy(platformServices.name);
  }),

  toggleService: adminProcedure
    .input(z.object({ id: z.string(), isEnabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(platformServices)
        .set({ isEnabled: input.isEnabled })
        .where(eq(platformServices.id, input.id));

      // Audit Log
      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "SERVICE_TOGGLE",
        entityType: "service",
        description: `Toggled service ${input.id} to ${input.isEnabled}`,
        metadata: { isEnabled: input.isEnabled },
      });

      return { success: true };
    }),

  // ── Audit Logs ────────────────────────────────────────────────────────────
  getAuditLogs: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        description: auditLogs.description,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);
  }),

  // ── System Monitoring ─────────────────────────────────────────────────────
  getSystemMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Mock CPU/RAM data to simulate APM response for the CEO dashboard
    const history = Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      cpu: Math.floor(Math.random() * 40) + 20, // 20% - 60%
      memory: Math.floor(Math.random() * 30) + 40, // 40% - 70%
      apiRequests: Math.floor(Math.random() * 5000) + 1000,
    }));

    return {
      history,
      current: {
        cpu: history[history.length - 1].cpu,
        memory: history[history.length - 1].memory,
        uptime: "14d 5h 23m",
        status: "Healthy",
        activeConnections: Math.floor(Math.random() * 100) + 50,
      }
    };
  }),

  // ── IoT Management ──────────────────────────────────────────────────────────
  getIotStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const totalDevices = await db.select({ count: count() }).from(iotDevices);
    const activeDevices = await db.select({ count: count() }).from(iotDevices).where(eq(iotDevices.status, 'online'));
    const totalGateways = await db.select({ count: count() }).from(iotGateways);
    const activeGateways = await db.select({ count: count() }).from(iotGateways).where(eq(iotGateways.status, 'online'));

    return {
      devices: { total: totalDevices[0].count, active: activeDevices[0].count },
      gateways: { total: totalGateways[0].count, active: activeGateways[0].count },
    };
  }),

  // ── Reports Analytics ───────────────────────────────────────────────────────
  getPlatformAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const totalReports = await db.select({ count: count() }).from(generatedReports);
    const reportData = await db.select({
      id: generatedReports.id,
      type: generatedReports.name,
      createdAt: generatedReports.generatedAt,
    }).from(generatedReports).orderBy(desc(generatedReports.generatedAt)).limit(10);

    return {
      totalReportsGenerated: totalReports[0].count,
      recentReports: reportData,
    };
  }),


  // ── Announcements ───────────────────────────────────────────────────────────
  listAnnouncements: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(platformAnnouncements).orderBy(desc(platformAnnouncements.createdAt));
  }),

  createAnnouncement: adminProcedure
    .input(
      z.object({
        title: z.string().min(3),
        content: z.string().min(5),
        type: z.enum(["info", "warning", "critical"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const id = crypto.randomUUID();
      await db.insert(platformAnnouncements).values({
        id,
        title: input.title,
        content: input.content,
        type: input.type,
        isActive: true,
      });

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "ANNOUNCEMENT_CREATED",
        entityType: "announcement",
        description: `Created announcement: ${input.title}`,
        metadata: { title: input.title, type: input.type },
      });

      return { success: true };
    }),

  toggleAnnouncement: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(platformAnnouncements)
        .set({ isActive: input.isActive })
        .where(eq(platformAnnouncements.id, input.id));

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "ANNOUNCEMENT_TOGGLE",
        entityType: "announcement",
        description: `Toggled announcement ${input.id} to ${input.isActive}`,
        metadata: { isActive: input.isActive },
      });

      return { success: true };
    }),

  deleteAnnouncement: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(platformAnnouncements)
        .where(eq(platformAnnouncements.id, input.id));

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "ANNOUNCEMENT_DELETED",
        entityType: "announcement",
        description: `Deleted announcement ${input.id}`,
        metadata: {},
      });

      return { success: true };
    }),

  // ── Platform Email Center ───────────────────────────────────────────────────

  getEmailRecipients: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Fetch all active users
    const allUsers = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(sql`${users.email} IS NOT NULL`);

    // Fetch all farm owners
    const allFarms = await db
      .select({ farmId: farms.id, farmName: farms.name, ownerId: farms.ownerId })
      .from(farms);

    return {
      users: allUsers,
      farms: allFarms,
    };
  }),

  sendPlatformEmail: adminProcedure
    .input(z.object({
      recipientIds: z.array(z.number()),
      subject: z.string().min(1),
      message: z.string().min(1),
      templateKey: z.enum(["platform_announcement", "payment_reminder", "security_alert", "custom"]),
      callToActionUrl: z.string().optional(),
      callToActionLabel: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.recipientIds.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No recipients selected." });
      }

      // Fetch the specific users to email
      const targets = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, input.recipientIds));

      if (targets.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No valid recipients found." });
      }

      let sentCount = 0;
      let failedCount = 0;

      // Send to each target
      for (const target of targets) {
        if (!target.email) continue;
        
        try {
          const to = { name: target.name || "User", email: target.email };
          let result;

          if (input.templateKey === "platform_announcement") {
            result = await emailService.sendPlatformAnnouncement(to, {
              subject: input.subject,
              message: input.message,
              callToActionUrl: input.callToActionUrl,
              callToActionLabel: input.callToActionLabel,
            }, ctx.user.id);
          } else if (input.templateKey === "security_alert") {
             result = await emailService.sendSecurityAlert(to, {
              alertTitle: input.subject,
              message: input.message,
             }, ctx.user.id);
          } else {
             // Fallback to custom
             result = await emailService.send({
               to,
               subject: input.subject,
               html: `<p>${input.message.replace(/\n/g, '<br>')}</p>`,
               text: input.message,
               templateKey: "custom",
               senderId: ctx.user.id,
             });
          }

          if (result.success) sentCount++;
          else failedCount++;
        } catch (err) {
          failedCount++;
          console.error("Failed to send platform email to", target.email, err);
        }
      }

      // Audit Log
      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "PLATFORM_EMAIL_SENT",
        entityType: "system",
        description: `Sent platform email "${input.subject}" to ${sentCount} recipients.`,
        metadata: { sentCount, failedCount, template: input.templateKey },
      });

      return { success: true, sentCount, failedCount };
    }),

  getPlatformEmailLogs: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select({
        id: platformEmailLogs.id,
        recipient: platformEmailLogs.recipient,
        subject: platformEmailLogs.subject,
        templateKey: platformEmailLogs.templateKey,
        status: platformEmailLogs.status,
        sentAt: platformEmailLogs.sentAt,
        sender: {
          id: users.id,
          name: users.name,
        }
      })
      .from(platformEmailLogs)
      .leftJoin(users, eq(platformEmailLogs.senderId, users.id))
      .orderBy(desc(platformEmailLogs.sentAt))
      .limit(100);
  }),
});
