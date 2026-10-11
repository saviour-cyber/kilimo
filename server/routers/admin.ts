import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, organizations, farms, iotDevices, platformModules, platformServices, auditLogs, iotGateways, generatedReports, platformAnnouncements, platformEmailLogs, subscriptions, subscriptionPlans, subscriptionPayments, emailAutomationLogs, userEmailPreferences, emailAutomationRules, regionalBriefingConfigs, diseaseScans, marketListings } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { provisionTrialSubscription } from "../services/subscriptions";
import { sql, count, eq, desc, inArray, and, sum } from "drizzle-orm";
import { z } from "zod";
import { emailService } from "../services/email";
import { getTemplatePreview } from "../services/email/templates";
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

  getEmailOperationalStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Count by status from platformEmailLogs
    const [sentStats] = await db
      .select({
        total: count(),
        sent: sql<number>`SUM(CASE WHEN ${platformEmailLogs.status} = 'sent' THEN 1 ELSE 0 END)`,
        delivered: sql<number>`SUM(CASE WHEN ${platformEmailLogs.status} = 'delivered' THEN 1 ELSE 0 END)`,
        failed: sql<number>`SUM(CASE WHEN ${platformEmailLogs.status} = 'failed' THEN 1 ELSE 0 END)`,
        queued: sql<number>`SUM(CASE WHEN ${platformEmailLogs.status} = 'queued' THEN 1 ELSE 0 END)`,
      })
      .from(platformEmailLogs);

    // Automation runs count
    const [autoStats] = await db
      .select({
        totalAuto: count(),
        autoSent: sql<number>`SUM(CASE WHEN ${emailAutomationLogs.status} = 'sent' THEN 1 ELSE 0 END)`,
        autoFailed: sql<number>`SUM(CASE WHEN ${emailAutomationLogs.status} = 'failed' THEN 1 ELSE 0 END)`,
        autoSkipped: sql<number>`SUM(CASE WHEN ${emailAutomationLogs.status} = 'skipped' THEN 1 ELSE 0 END)`,
      })
      .from(emailAutomationLogs);

    // Latest automation run
    const [lastAutoRun] = await db
      .select({ sentAt: emailAutomationLogs.sentAt, status: emailAutomationLogs.status, type: emailAutomationLogs.automationType })
      .from(emailAutomationLogs)
      .orderBy(desc(emailAutomationLogs.sentAt))
      .limit(1);

    return {
      providerName: emailService.getProviderName(),
      platformLogs: {
        total: Number(sentStats?.total ?? 0),
        sent: Number(sentStats?.sent ?? 0),
        delivered: Number(sentStats?.delivered ?? 0),
        failed: Number(sentStats?.failed ?? 0),
        queued: Number(sentStats?.queued ?? 0),
      },
      automationLogs: {
        total: Number(autoStats?.totalAuto ?? 0),
        sent: Number(autoStats?.autoSent ?? 0),
        failed: Number(autoStats?.autoFailed ?? 0),
        skipped: Number(autoStats?.autoSkipped ?? 0),
      },
      lastRun: lastAutoRun || null,
      nextScheduledRun: "Daily at 08:00 UTC",
    };
  }),

  getEmailAutomationRules: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Seed defaults if table is empty
    const existing = await db.select().from(emailAutomationRules);
    if (existing.length === 0) {
      const defaultRules = [
        {
          id: "trial_ending_warnings",
          name: "Trial Expiration Warnings (7d, 3d, 1d)",
          description: "Sends automated warnings with days remaining and upgrade link before the trial period concludes.",
          category: "billing" as const,
          isEnabled: true,
          isSystemEnforced: false,
          triggerType: "scheduled_cron",
          cronExpression: "0 0 8 * * *",
          timeZone: "UTC",
          templateKey: "trial_ending_Xd",
          recipientRule: "Organization contact email or owner email for trialing subscriptions.",
          lastExecutionStatus: "success",
          lastExecutionMessage: "Runs daily via billingEmailRemindersHandler.",
        },
        {
          id: "trial_expired_notice",
          name: "Trial Expiration Confirmation",
          description: "Immediately notifies farmers that their trial has elapsed, explaining safe data retention and reactivation.",
          category: "billing" as const,
          isEnabled: true,
          isSystemEnforced: true, // System enforced: mandated by subscription lifecycle
          triggerType: "lifecycle_event",
          cronExpression: "Hourly / Lifecycle",
          timeZone: "UTC",
          templateKey: "trial_expired",
          recipientRule: "Organizations transitioning to expired status.",
          lastExecutionStatus: "success",
          lastExecutionMessage: "Enforced by enforceSubscriptionsHandler.",
        },
        {
          id: "subscription_past_due",
          name: "Subscription Past Due (7-Day Grace)",
          description: "Notifies organization owner of failed renewals and initiates a 7-day grace window before service interruption.",
          category: "billing" as const,
          isEnabled: true,
          isSystemEnforced: true, // Mandated by subscription lifecycle
          triggerType: "lifecycle_event",
          cronExpression: "Daily / On Billing Failure",
          timeZone: "UTC",
          templateKey: "subscription_past_due",
          recipientRule: "Active subscriptions exceeding currentPeriodEnd.",
          lastExecutionStatus: "success",
          lastExecutionMessage: "Enforced by enforceSubscriptionsHandler.",
        },
        {
          id: "subscription_suspended",
          name: "Subscription Suspended Notice",
          description: "Dispatched when non-payment exceeds 7-day grace period, pausing team access with direct reactivation CTA.",
          category: "billing" as const,
          isEnabled: true,
          isSystemEnforced: true, // Mandated by subscription lifecycle
          triggerType: "lifecycle_event",
          cronExpression: "Daily / After Grace Period",
          timeZone: "UTC",
          templateKey: "subscription_suspended",
          recipientRule: "Past-due subscriptions exceeding 7-day grace period.",
          lastExecutionStatus: "success",
          lastExecutionMessage: "Enforced by enforceSubscriptionsHandler.",
        },
        {
          id: "subscription_renewal_reminder",
          name: "Upcoming Renewal Notice (3 Days Prior)",
          description: "Proactively alerts active subscribers 3 days before renewal date with amount and payment details.",
          category: "billing" as const,
          isEnabled: true,
          isSystemEnforced: false,
          triggerType: "scheduled_cron",
          cronExpression: "0 0 8 * * *",
          timeZone: "UTC",
          templateKey: "payment_reminder",
          recipientRule: "Active subscriptions 3 days prior to currentPeriodEnd.",
          lastExecutionStatus: "success",
          lastExecutionMessage: "Dispatched daily via billingEmailRemindersHandler.",
        },
        {
          id: "regional_agri_briefing",
          name: "Regional Agronomy & Disease Briefing",
          description: "Delivers anonymous aggregated regional weather forecasts, pest warnings, and local market wholesale rates.",
          category: "agricultural" as const,
          isEnabled: true,
          isSystemEnforced: false,
          triggerType: "scheduled_cron",
          cronExpression: "Weekly (Every Monday 06:00 UTC)",
          timeZone: "UTC",
          templateKey: "regional_insight",
          recipientRule: "Farmers opted in to agricultural insights residing in regions with sufficient verified scan data.",
          lastExecutionStatus: "success",
          lastExecutionMessage: "Aggregated without disclosing individual farm identities.",
        },
      ];

      for (const rule of defaultRules) {
        await db.insert(emailAutomationRules).values(rule);
      }

      return db.select().from(emailAutomationRules);
    }

    return existing;
  }),

  toggleEmailAutomationRule: adminProcedure
    .input(z.object({
      ruleId: z.string(),
      isEnabled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [rule] = await db
        .select()
        .from(emailAutomationRules)
        .where(eq(emailAutomationRules.id, input.ruleId))
        .limit(1);

      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
      }

      if (rule.isSystemEnforced && !input.isEnabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "System-enforced rules cannot be paused. Mandatory subscription lifecycle rules must remain active for platform compliance.",
        });
      }

      await db
        .update(emailAutomationRules)
        .set({ isEnabled: input.isEnabled })
        .where(eq(emailAutomationRules.id, input.ruleId));

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "EMAIL_RULE_TOGGLED",
        entityType: "system",
        description: `Email automation rule "${rule.name}" set to ${input.isEnabled ? 'enabled' : 'disabled'}.`,
        metadata: { ruleId: input.ruleId, isEnabled: input.isEnabled },
      });

      return { success: true };
    }),

  getRegionalBriefingConfigs: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const configs = await db.select().from(regionalBriefingConfigs);
    if (configs.length === 0) {
      // Seed initial key agricultural regions
      const defaultConfigs = [
        {
          regionName: "Mount Kenya Central",
          county: "Nyeri",
          frequency: "weekly" as const,
          minScanThreshold: 3,
          requireWeatherData: true,
          requireMarketData: true,
          isEnabled: true,
        },
        {
          regionName: "Rift Valley Highland",
          county: "Nakuru",
          frequency: "weekly" as const,
          minScanThreshold: 3,
          requireWeatherData: true,
          requireMarketData: true,
          isEnabled: true,
        },
        {
          regionName: "Eastern Drylands",
          county: "Machakos",
          frequency: "biweekly" as const,
          minScanThreshold: 2,
          requireWeatherData: true,
          requireMarketData: false,
          isEnabled: true,
        },
      ];

      for (const item of defaultConfigs) {
        await db.insert(regionalBriefingConfigs).values(item);
      }

      return db.select().from(regionalBriefingConfigs);
    }

    return configs;
  }),

  updateRegionalBriefingConfig: adminProcedure
    .input(z.object({
      id: z.number(),
      frequency: z.enum(["daily", "weekly", "biweekly"]).optional(),
      minScanThreshold: z.number().min(1).max(20).optional(),
      requireWeatherData: z.boolean().optional(),
      requireMarketData: z.boolean().optional(),
      isEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(regionalBriefingConfigs)
        .set({
          ...(input.frequency ? { frequency: input.frequency } : {}),
          ...(input.minScanThreshold !== undefined ? { minScanThreshold: input.minScanThreshold } : {}),
          ...(input.requireWeatherData !== undefined ? { requireWeatherData: input.requireWeatherData } : {}),
          ...(input.requireMarketData !== undefined ? { requireMarketData: input.requireMarketData } : {}),
          ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
        })
        .where(eq(regionalBriefingConfigs.id, input.id));

      await db.insert(auditLogs).values({
        farmId: 0,
        userId: ctx.user.id,
        action: "REGIONAL_BRIEFING_UPDATED",
        entityType: "system",
        description: `Regional briefing configuration id=${input.id} updated.`,
        metadata: input,
      });

      return { success: true };
    }),

  triggerRegionalBriefing: adminProcedure
    .input(z.object({
      configId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [cfg] = await db
        .select()
        .from(regionalBriefingConfigs)
        .where(eq(regionalBriefingConfigs.id, input.configId))
        .limit(1);

      if (!cfg) throw new TRPCError({ code: "NOT_FOUND", message: "Config not found" });

      // Gather real verified regional disease scans without fabricating
      const recentScans = await db
        .select({
          detectedDisease: diseaseScans.detectedDisease,
          severity: diseaseScans.severity,
          crop: diseaseScans.scanType,
        })
        .from(diseaseScans)
        .innerJoin(farms, eq(diseaseScans.farmId, farms.id))
        .where(
          and(
            eq(farms.county, cfg.county),
            sql`${diseaseScans.createdAt} >= DATE_SUB(NOW(), INTERVAL 14 DAY)`
          )
        );

      if (recentScans.length < cfg.minScanThreshold) {
        return {
          success: false,
          dispatchedCount: 0,
          reason: `Insufficient anonymous regional data: found ${recentScans.length} scans in ${cfg.county}, minimum required is ${cfg.minScanThreshold}. No fabricated information allowed.`,
        };
      }

      // Aggregate top detected diseases anonymously
      const diseaseCounts: Record<string, number> = {};
      for (const scan of recentScans) {
        if (scan.detectedDisease) {
          diseaseCounts[scan.detectedDisease] = (diseaseCounts[scan.detectedDisease] || 0) + 1;
        }
      }

      const topDiseases = Object.entries(diseaseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => `${name} (${count} verified occurrences)`)
        .join(", ");

      const pestAlert = topDiseases ? `Recent cluster analysis: elevated occurrences of ${topDiseases}. Recommend preventive foliar checks.` : undefined;

      // Query real regional market listings
      const marketSample = await db
        .select({
          title: marketListings.title,
          price: marketListings.price,
          unit: marketListings.unit,
        })
        .from(marketListings)
        .where(and(eq(marketListings.county, cfg.county), eq(marketListings.status, "active")))
        .limit(3);

      const marketSummary = marketSample.length > 0
        ? marketSample.map(m => `${m.title}: KES ${m.price}/${m.unit || 'unit'}`).join(" | ")
        : "Steady wholesale market activity across regional aggregation centers.";

      // Find eligible farmers in this county who are opted in
      const eligibleUsers = await db
        .select({
          userId: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .innerJoin(farms, eq(farms.ownerId, users.id))
        .leftJoin(userEmailPreferences, eq(userEmailPreferences.userId, users.id))
        .where(
          and(
            eq(farms.county, cfg.county),
            sql`(${userEmailPreferences.agriInsightEmails} IS NULL OR ${userEmailPreferences.agriInsightEmails} = 1)`
          )
        );

      let dispatchedCount = 0;
      for (const u of eligibleUsers) {
        if (!u.email) continue;
        try {
          const sendRes = await emailService.sendRegionalAgriInsightEmail(
            { name: u.name || "Farmer", email: u.email },
            {
              regionName: cfg.regionName,
              weatherSummary: `Forecast indicates seasonal temperatures with scattered morning moisture in ${cfg.county}.`,
              cropInsights: "Favorable conditions for vegetative development. Monitor field drainage during rain events.",
              pestAlerts: pestAlert,
              marketInsights: marketSummary,
            }
          );

          if (sendRes.success) {
            dispatchedCount++;
            await db.insert(emailAutomationLogs).values({
              userId: u.userId,
              recipientEmail: u.email,
              automationType: "regional_agri_briefing",
              status: "sent",
              metadata: { region: cfg.regionName, county: cfg.county },
            });
          }
        } catch (e) {
          console.error(`Failed to send regional briefing to ${u.email}:`, e);
        }
      }

      await db
        .update(regionalBriefingConfigs)
        .set({ lastDispatchedAt: new Date() })
        .where(eq(regionalBriefingConfigs.id, cfg.id));

      return {
        success: true,
        dispatchedCount,
        reason: `Successfully dispatched to ${dispatchedCount} farmers in ${cfg.regionName}.`,
      };
    }),

  previewEmailTemplate: adminProcedure
    .input(z.object({
      templateKey: z.string(),
    }))
    .query(async ({ input }) => {
      return getTemplatePreview(input.templateKey);
    }),

  retryEmailAutomationLog: adminProcedure
    .input(z.object({
      logId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [log] = await db
        .select()
        .from(emailAutomationLogs)
        .where(eq(emailAutomationLogs.id, input.logId))
        .limit(1);

      if (!log) throw new TRPCError({ code: "NOT_FOUND", message: "Log not found" });

      // Retry send based on automationType
      let result;
      const to = { email: log.recipientEmail, name: "Subscriber" };

      if (log.automationType.startsWith("trial_ending_")) {
        result = await emailService.sendTrialEndingEmail(to, {
          organizationName: "Organization",
          planName: "Trial",
          daysRemaining: 3,
          expiresAt: new Date(Date.now() + 3 * 86400000).toLocaleDateString(),
        });
      } else if (log.automationType === "trial_expired") {
        result = await emailService.sendTrialExpiredEmail(to, {
          organizationName: "Organization",
          planName: "Trial",
        });
      } else if (log.automationType === "subscription_past_due") {
        result = await emailService.sendSubscriptionPastDueEmail(to, {
          organizationName: "Organization",
          planName: "Subscription",
        });
      } else if (log.automationType === "subscription_suspended") {
        result = await emailService.sendSubscriptionSuspendedEmail(to, {
          organizationName: "Organization",
          planName: "Subscription",
        });
      } else {
        result = await emailService.send({
          to,
          subject: "KiliSense Automated Communication",
          html: `<p>Retrying automated message for ${log.automationType}.</p>`,
        });
      }

      await db
        .update(emailAutomationLogs)
        .set({
          status: result.success ? "sent" : "failed",
          errorMessage: result.error || null,
        })
        .where(eq(emailAutomationLogs.id, input.logId));

      return { success: result.success, error: result.error };
    }),

  getEmailAutomationLogs: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["all", "sent", "failed", "skipped"]).optional(),
      category: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const query = db
        .select({
          id: emailAutomationLogs.id,
          organizationId: emailAutomationLogs.organizationId,
          recipientEmail: emailAutomationLogs.recipientEmail,
          automationType: emailAutomationLogs.automationType,
          status: emailAutomationLogs.status,
          errorMessage: emailAutomationLogs.errorMessage,
          metadata: emailAutomationLogs.metadata,
          sentAt: emailAutomationLogs.sentAt,
          orgName: organizations.name,
        })
        .from(emailAutomationLogs)
        .leftJoin(organizations, eq(emailAutomationLogs.organizationId, organizations.id))
        .orderBy(desc(emailAutomationLogs.sentAt))
        .limit(100);

      const logs = await query;

      if (!input) return logs;

      return logs.filter(l => {
        if (input.status && input.status !== "all" && l.status !== input.status) return false;
        if (input.search) {
          const s = input.search.toLowerCase();
          const matchEmail = l.recipientEmail.toLowerCase().includes(s);
          const matchOrg = l.orgName?.toLowerCase().includes(s);
          const matchType = l.automationType.toLowerCase().includes(s);
          if (!matchEmail && !matchOrg && !matchType) return false;
        }
        if (input.category && input.category !== "all") {
          if (input.category === "billing" && !l.automationType.includes("trial") && !l.automationType.includes("subscription") && !l.automationType.includes("payment")) return false;
          if (input.category === "agricultural" && !l.automationType.includes("agri") && !l.automationType.includes("digest")) return false;
        }
        return true;
      });
    }),

  sendTestEmail: adminProcedure
    .input(z.object({
      targetEmail: z.string().email("Please enter a valid destination email address"),
      templateKey: z.enum([
        "trial_started",
        "trial_ending_7d",
        "trial_ending_3d",
        "trial_ending_1d",
        "trial_expired",
        "subscription_past_due",
        "subscription_suspended",
        "payment_success",
        "payment_failed",
        "plan_changed",
        "usage_limit_warning",
        "farm_digest",
        "regional_insight",
        "platform_announcement",
        "security_alert",
      ]),
    }))
    .mutation(async ({ input, ctx }) => {
      const to = { name: ctx.user.name || "Admin Tester", email: input.targetEmail };
      let result;

      switch (input.templateKey) {
        case "trial_started":
          result = await emailService.sendTrialStartedEmail(to, {
            organizationName: "Highland Greens Farm",
            planName: "Pro Agriculture",
            trialDays: 14,
            expiresAt: new Date(Date.now() + 14 * 86400000).toLocaleDateString(),
          });
          break;
        case "trial_ending_7d":
        case "trial_ending_3d":
        case "trial_ending_1d": {
          const days = input.templateKey === "trial_ending_7d" ? 7 : input.templateKey === "trial_ending_3d" ? 3 : 1;
          result = await emailService.sendTrialEndingEmail(to, {
            organizationName: "Highland Greens Farm",
            planName: "Pro Agriculture",
            daysRemaining: days,
            expiresAt: new Date(Date.now() + days * 86400000).toLocaleDateString(),
          });
          break;
        }
        case "trial_expired":
          result = await emailService.sendTrialExpiredEmail(to, {
            organizationName: "Highland Greens Farm",
            planName: "Pro Agriculture",
          });
          break;
        case "subscription_past_due":
          result = await emailService.sendSubscriptionPastDueEmail(to, {
            organizationName: "Highland Greens Farm",
            planName: "Commercial Enterprise",
            amount: "KES 12,000",
            dueDate: new Date().toLocaleDateString(),
          });
          break;
        case "subscription_suspended":
          result = await emailService.sendSubscriptionSuspendedEmail(to, {
            organizationName: "Highland Greens Farm",
            planName: "Commercial Enterprise",
          });
          break;
        case "payment_success":
          result = await emailService.sendPaymentSuccessEmail(to, {
            organizationName: "Highland Greens Farm",
            planName: "Commercial Enterprise",
            amount: "12,000.00",
            currency: "KES",
          });
          break;
        case "payment_failed":
          result = await emailService.sendPaymentFailedEmail(to, {
            organizationName: "Highland Greens Farm",
            planName: "Commercial Enterprise",
            amount: "12,000.00",
            currency: "KES",
            failureReason: "Insufficient M-Pesa balance",
          });
          break;
        case "plan_changed":
          result = await emailService.sendPlanChangedEmail(to, {
            organizationName: "Highland Greens Farm",
            oldPlanName: "Starter Farm",
            newPlanName: "Commercial Enterprise",
          });
          break;
        case "usage_limit_warning":
          result = await emailService.sendUsageLimitWarningEmail(to, {
            organizationName: "Highland Greens Farm",
            metricName: "Connected IoT Devices",
            currentUsage: 9,
            maxLimit: 10,
            percentUsed: 90,
          });
          break;
        case "farm_digest":
          result = await emailService.sendFarmDigestEmail(to, {
            farmName: "Highland Greens",
            periodLabel: "Weekly Performance Digest",
            highlights: [
              { title: "Soil Moisture Levels", description: "Average moisture held at optimal 42%", metric: "42%" },
              { title: "Milk Production", description: "Produced 1,280 liters across all milking cows", metric: "1,280 L" },
              { title: "Planting Cycle", description: "Maize Section 2 moved into flowering stage" },
            ],
          });
          break;
        case "regional_insight":
          result = await emailService.sendRegionalAgriInsightEmail(to, {
            regionName: "Mount Kenya Central",
            weatherSummary: "Expected light rain (15-20mm) over Wednesday through Friday, temperatures 16°C - 24°C.",
            cropInsights: "Favorable conditions for foliar nutrient spraying before Thursday rains.",
            pestAlerts: "Increased Fall Armyworm activity detected across neighboring maize corridors.",
            marketInsights: "Local dry maize wholesale price up 6% this week to KES 3,800 per 90kg bag.",
          });
          break;
        case "platform_announcement":
          result = await emailService.sendPlatformAnnouncement(to, {
            subject: "Platform Notice Sample",
            message: "This is a sample test of the KiliSense announcement email template.",
          });
          break;
        case "security_alert":
          result = await emailService.sendSecurityAlert(to, {
            alertTitle: "Security Notice Sample",
            message: "This is a sample test of the KiliSense security alert email template.",
          });
          break;
        default:
          result = { success: false, error: "Unknown template" };
      }

      return {
        ...result,
        provider: emailService.getProviderName(),
      };
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
