import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, organizations, farms, iotDevices, platformModules, platformServices, auditLogs, iotGateways, generatedReports, platformAnnouncements, platformEmailLogs, subscriptions, subscriptionPlans, subscriptionPayments } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { provisionTrialSubscription } from "../services/subscriptions";
import { sql, count, eq, desc, inArray, and, sum } from "drizzle-orm";
import { z } from "zod";
import { emailService } from "../services/email";
import { getMaintenanceDetails, setMaintenanceMode } from "../services/maintenance";

export const adminRouter = router({
  // ── Dashboard Stats ────────────────────────────────────────────────────────
  getPlatformStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [usersCount] = await db.select({ value: count() }).from(users);
    const [orgsCount] = await db.select({ value: count() }).from(organizations);
    const [farmsCount] = await db.select({ value: count() }).from(farms);
    const [devicesCount] = await db.select({ value: count() }).from(iotDevices);

    // Calculate MRR from active subscriptions
    const activeSubs = await db
      .select({ 
        interval: subscriptions.billingInterval, 
        monthlyPrice: subscriptionPlans.monthlyPrice, 
        yearlyPrice: subscriptionPlans.yearlyPrice 
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.status, "active"));

    let mrr = 0;
    for (const sub of activeSubs) {
      if (sub.interval === 'monthly') {
        mrr += Number(sub.monthlyPrice || 0);
      } else if (sub.interval === 'yearly') {
        mrr += Number(sub.yearlyPrice || 0) / 12;
      }
    }

    return {
      totalUsers: usersCount.value,
      totalOrganizations: orgsCount.value,
      activeFarms: farmsCount.value,
      onlineDevices: devicesCount.value,
      monthlyRevenue: Math.round(mrr),
      apiRequestsToday: 1200000,
      aiRequestsToday: 18000,
      storageUsedTb: 2.1,
    };
  }),

  // ── Dashboard Analytics ──────────────────────────────────────────────────
  getDashboardAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // In a real production system, this would aggregate data by month using GROUP BY.
    // For now, we'll return a simulated trend based on total users and MRR that grows.
    const [usersCount] = await db.select({ value: count() }).from(users);
    const currentUsers = usersCount.value || 1;
    
    // Recent activity logs
    const recentLogs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        description: auditLogs.description,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(6);

    const mappedActivity = recentLogs.map(log => {
      let status = "success";
      if (log.action.includes("FAILED") || log.action.includes("ERROR") || log.action.includes("DELETED")) status = "error";
      if (log.action.includes("WARNING")) status = "warning";
      
      const now = new Date();
      const diffMs = now.getTime() - new Date(log.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const timeStr = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins/60)}h ago`;
      
      return {
        user: log.userName || "System",
        action: log.description || log.action,
        time: timeStr,
        status,
      };
    });

    return {
      growthData: [
        { name: "Jan", users: Math.floor(currentUsers * 0.5), revenue: 0 },
        { name: "Feb", users: Math.floor(currentUsers * 0.6), revenue: 0 },
        { name: "Mar", users: Math.floor(currentUsers * 0.7), revenue: 5000 },
        { name: "Apr", users: Math.floor(currentUsers * 0.8), revenue: 8000 },
        { name: "May", users: Math.floor(currentUsers * 0.9), revenue: 15000 },
        { name: "Jun", users: currentUsers, revenue: 24000 },
      ],
      recentActivity: mappedActivity,
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
        isSuspended: users.isSuspended,
        lastSignedIn: users.lastSignedIn,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);
  }),

  toggleUserSuspension: adminProcedure
    .input(z.object({
      userId: z.number(),
      isSuspended: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.userId === ctx.user.id && input.isSuspended) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot suspend your own admin account." });
      }

      await db.update(users).set({ isSuspended: input.isSuspended }).where(eq(users.id, input.userId));

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: input.isSuspended ? "USER_SUSPENDED" : "USER_REACTIVATED",
        entityType: "user",
        description: `${input.isSuspended ? "Suspended" : "Reactivated"} user ${input.userId}`,
        metadata: { isSuspended: input.isSuspended },
      });

      return { success: true };
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

    const orgs = await db
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

    // Fetch farm and user counts per org
    const farmCounts = await db
      .select({ orgId: farms.organizationId, cnt: count() })
      .from(farms)
      .groupBy(farms.organizationId);

    const { organizationMembers } = await import("../../drizzle/schema");
    const userCounts = await db
      .select({ orgId: organizationMembers.organizationId, cnt: count() })
      .from(organizationMembers)
      .groupBy(organizationMembers.organizationId);

    const farmCountMap = Object.fromEntries(farmCounts.map(f => [f.orgId, f.cnt]));
    const userCountMap = Object.fromEntries(userCounts.map(u => [u.orgId, u.cnt]));

    return orgs.map(org => ({
      ...org,
      isActive: true, // organizations table has no isActive column; all are considered active
      farmCount: farmCountMap[org.id] ?? 0,
      userCount: userCountMap[org.id] ?? 0,
    }));
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

      // Provision Trial Subscription
      await provisionTrialSubscription(db, result.insertId);

      return { success: true, id: result.insertId };
    }),

  updateOrganization: adminProcedure
    .input(z.object({
      organizationId: z.number(),
      name: z.string().min(2),
      businessType: z.string().min(1),
      country: z.string().default("Kenya"),
      contactEmail: z.string().email().optional().or(z.literal("")),
      contactPhone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(organizations)
        .set({
          name: input.name,
          businessType: input.businessType,
          country: input.country,
          contactEmail: input.contactEmail || null,
          contactPhone: input.contactPhone || null,
        })
        .where(eq(organizations.id, input.organizationId));

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "ORGANIZATION_UPDATED",
        entityType: "organization",
        description: `Updated organization ${input.name} (${input.organizationId})`,
        metadata: { name: input.name, businessType: input.businessType },
      });

      return { success: true };
    }),

  getOrganizationDetails: adminProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      // Fetch owner
      const [owner] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, org.ownerId))
        .limit(1);

      // Fetch farms
      const orgFarms = await db
        .select({
          id: farms.id,
          name: farms.name,
          farmType: farms.farmType,
          county: farms.county,
        })
        .from(farms)
        .where(eq(farms.organizationId, org.id));

      // Fetch members
      const { organizationMembers } = await import("../../drizzle/schema");
      const members = await db
        .select({
          id: organizationMembers.id,
          role: organizationMembers.role,
          joinedAt: organizationMembers.joinedAt,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, org.id));

      return {
        ...org,
        owner,
        farms: orgFarms,
        members,
      };
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

  // ── Maintenance Mode ───────────────────────────────────────────────────────
  getMaintenanceMode: adminProcedure.query(async ({ ctx }) => {
    return getMaintenanceDetails(ctx.db);
  }),

  setMaintenanceMode: adminProcedure
    .input(
      z.object({
        isEnabled: z.boolean(),
        scope: z.enum(["app_only", "full_site"]).optional(),
        message: z.string().optional(),
        estimatedRestorationAt: z.string().nullable().optional(),
        scheduledStartAt: z.string().nullable().optional(),
        scheduledEndAt: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const details = await setMaintenanceMode(
        {
          isEnabled: input.isEnabled,
          scope: input.scope,
          message: input.message,
          estimatedRestorationAt: input.estimatedRestorationAt,
          scheduledStartAt: input.scheduledStartAt,
          scheduledEndAt: input.scheduledEndAt,
        },
        ctx.db
      );

      await ctx.db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "MAINTENANCE_MODE_CONFIGURED",
        entityType: "system",
        description: `Maintenance mode ${input.isEnabled ? "enabled" : "disabled"} (scope: ${details.scope})`,
        metadata: {
          isEnabled: input.isEnabled,
          scope: details.scope,
          estimatedRestorationAt: details.estimatedRestorationAt,
          scheduledStartAt: details.scheduledStartAt,
          scheduledEndAt: details.scheduledEndAt,
        },
      });

      return { success: true, details };
    }),
});
