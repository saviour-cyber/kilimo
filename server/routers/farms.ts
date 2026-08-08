import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { farmMembers, farmModules, farms, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export async function assertFarmMember(farmId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const [member] = await db
    .select()
    .from(farmMembers)
    .where(and(eq(farmMembers.farmId, farmId), eq(farmMembers.userId, userId)));

  if (!member || !member.isActive) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this farm" });
  }

  return member;
}

export function assertMinRole(member: { farmRole: string }, minRole: "viewer" | "worker" | "crop_officer" | "veterinary_officer" | "farm_manager" | "administrator" | "owner") {
  const roles = {
    viewer: 1,
    worker: 2,
    crop_officer: 3,
    veterinary_officer: 3,
    farm_manager: 4,
    administrator: 5,
    owner: 6,
  };

  const userLevel = roles[member.farmRole as keyof typeof roles] || 0;
  const requiredLevel = roles[minRole];

  if (userLevel < requiredLevel) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions for this action" });
  }
}

export const farmsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const results = await db
      .select({
        farm: farms,
        role: farmMembers.farmRole,
      })
      .from(farmMembers)
      .innerJoin(farms, eq(farmMembers.farmId, farms.id))
      .where(and(eq(farmMembers.userId, ctx.user.id), eq(farmMembers.isActive, true), eq(farms.isArchived, false)));

    return results;
  }),

  get: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const member = await assertFarmMember(input.farmId, ctx.user.id);

      const [farm] = await db
        .select()
        .from(farms)
        .where(eq(farms.id, input.farmId));

      if (!farm) throw new TRPCError({ code: "NOT_FOUND" });

      return { farm, role: member.farmRole };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        farmType: z.enum(["crop", "livestock", "mixed", "aquaculture", "poultry", "other"]),
        sizeHectares: z.string().optional(),
        currency: z.string(),
        timezone: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { checkFarmLimit } = await import("../services/usageLimits");

      // We assume user is part of organization 1 for now, or fetch from users table
      // To be robust, let's fetch the user's primary organization
      const { users, organizationMembers } = await import("../../drizzle/schema");
      
      const [member] = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, ctx.user.id)).limit(1);
      const orgId = member ? member.organizationId : 1;

      try {
        await checkFarmLimit(orgId);
      } catch (err: any) {
        throw new TRPCError({ code: "FORBIDDEN", message: err.message });
      }

      const { sizeHectares, ...rest } = input;

      const [result] = await db.insert(farms).values({
        ...rest,
        sizeHectares: sizeHectares ? sizeHectares : undefined,
        ownerId: ctx.user.id,
        organizationId: orgId,
      });

      const farmId = (result as any).insertId as number;

      await db.insert(farmMembers).values({
        farmId,
        userId: ctx.user.id,
        farmRole: "owner",
      });

      // Default modules
      const defaultModules = ["dashboard", "crop", "livestock", "inventory", "finance", "tasks", "notifications", "settings"];
      await db.insert(farmModules).values(
        defaultModules.map((mod) => ({
          farmId,
          moduleKey: mod,
          isEnabled: true,
          enabledByUserId: ctx.user.id,
        }))
      );

      return { farmId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        sizeHectares: z.string().optional(),
        currency: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      const { farmId, sizeHectares, ...data } = input;

      await db
        .update(farms)
        .set({
          ...data,
          sizeHectares: sizeHectares ? sizeHectares : undefined,
        })
        .where(eq(farms.id, farmId));

      return { success: true };
    }),

  getModules: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await assertFarmMember(input.farmId, ctx.user.id);

      return db.select().from(farmModules).where(eq(farmModules.farmId, input.farmId));
    }),

  toggleModule: protectedProcedure
    .input(z.object({ farmId: z.number(), moduleKey: z.string(), isEnabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      const existing = await db
        .select()
        .from(farmModules)
        .where(and(eq(farmModules.farmId, input.farmId), eq(farmModules.moduleKey, input.moduleKey)));

      if (existing.length > 0) {
        await db
          .update(farmModules)
          .set({ isEnabled: input.isEnabled })
          .where(and(eq(farmModules.farmId, input.farmId), eq(farmModules.moduleKey, input.moduleKey)));
      } else {
        await db.insert(farmModules).values({
          farmId: input.farmId,
          moduleKey: input.moduleKey,
          isEnabled: input.isEnabled,
          enabledByUserId: ctx.user.id,
        });
      }

      return { success: true };
    }),

  getMembers: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await assertFarmMember(input.farmId, ctx.user.id);

      return db
        .select({
          id: farmMembers.id,
          role: farmMembers.farmRole,
          isActive: farmMembers.isActive,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(farmMembers)
        .innerJoin(users, eq(farmMembers.userId, users.id))
        .where(and(eq(farmMembers.farmId, input.farmId), eq(farmMembers.isActive, true)));
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({ farmId: z.number(), memberId: z.number(), farmRole: z.enum(["owner", "administrator", "farm_manager", "worker", "veterinary_officer", "crop_officer", "viewer"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      await db
        .update(farmMembers)
        .set({ farmRole: input.farmRole })
        .where(and(eq(farmMembers.id, input.memberId), eq(farmMembers.farmId, input.farmId)));

      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ farmId: z.number(), memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      await db
        .update(farmMembers)
        .set({ isActive: false })
        .where(and(eq(farmMembers.id, input.memberId), eq(farmMembers.farmId, input.farmId)));

      return { success: true };
    }),
});
