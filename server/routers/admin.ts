import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, organizations, farms, iotDevices, platformModules, platformServices } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sql, count, eq } from "drizzle-orm";
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
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(platformModules)
        .set({ isEnabled: input.isEnabled })
        .where(eq(platformModules.id, input.id));

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
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(platformServices)
        .set({ isEnabled: input.isEnabled })
        .where(eq(platformServices.id, input.id));

      return { success: true };
    }),
});
