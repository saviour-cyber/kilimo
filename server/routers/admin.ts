import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, organizations, farms, iotDevices, platformModules, platformServices, auditLogs, iotGateways, generatedReports, platformAnnouncements } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sql, count, eq, desc } from "drizzle-orm";
import { z } from "zod";

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
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .orderBy(organizations.createdAt);
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
        userId: ctx.user.id,
        action: "MODULE_TOGGLE",
        entityType: "module",
        entityId: input.id,
        details: { isEnabled: input.isEnabled },
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
        userId: ctx.user.id,
        action: "SERVICE_TOGGLE",
        entityType: "service",
        entityId: input.id,
        details: { isEnabled: input.isEnabled },
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
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        user: {
          id: users.id,
          fullName: users.fullName,
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
      type: generatedReports.reportType,
      createdAt: generatedReports.createdAt,
    }).from(generatedReports).orderBy(desc(generatedReports.createdAt)).limit(10);

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
    .input(z.object({
      title: z.string(),
      content: z.string(),
      type: z.enum(["info", "warning", "critical", "feature"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [result] = await db.insert(platformAnnouncements).values({
        title: input.title,
        content: input.content,
        type: input.type,
      });

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "ANNOUNCEMENT_CREATED",
        entityType: "announcement",
        entityId: result.insertId.toString(),
        details: { title: input.title, type: input.type },
      });

      return { success: true, id: result.insertId };
    }),

  toggleAnnouncement: adminProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(platformAnnouncements)
        .set({ isActive: input.isActive })
        .where(eq(platformAnnouncements.id, input.id));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "ANNOUNCEMENT_TOGGLE",
        entityType: "announcement",
        entityId: input.id.toString(),
        details: { isActive: input.isActive },
      });

      return { success: true };
    }),
});
