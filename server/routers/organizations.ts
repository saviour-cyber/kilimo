import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const organizationsRouter = router({
  get: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { organizations } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [org] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
      return org;
    }),

  update: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      logoUrl: z.string().optional(),
      country: z.string().optional(),
      county: z.string().optional(),
      address: z.string().optional(),
      taxId: z.string().optional(),
      contactEmail: z.string().email().optional().or(z.literal("")),
      contactPhone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { organizations } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [org] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
      if (!org || org.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only organization owner can update details" });
      }

      await db.update(organizations).set({
        name: input.name,
        description: input.description,
        logoUrl: input.logoUrl,
        country: input.country,
        county: input.county,
        address: input.address,
        taxId: input.taxId,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone,
      }).where(eq(organizations.id, input.organizationId));

      return { success: true };
    }),

  getFarms: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { farms, farmModules } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const allFarms = await db.select().from(farms)
        .where(and(eq(farms.organizationId, input.organizationId), eq(farms.isArchived, false)));

      // Fetch modules for each farm
      const farmIds = allFarms.map(f => f.id);
      const allModules = farmIds.length > 0
        ? await db.select().from(farmModules).where(inArray(farmModules.farmId, farmIds))
        : [];

      return allFarms.map(farm => ({
        ...farm,
        modules: allModules.filter(m => m.farmId === farm.id && m.isEnabled).map(m => m.moduleKey),
      }));
    }),

  // ─── Team Management ────────────────────────────────────────────────────────

  getTeam: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { organizationMembers, users, farmMembers, farms } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const members = await db
        .select({
          id: organizationMembers.id,
          userId: organizationMembers.userId,
          role: organizationMembers.role,
          joinedAt: organizationMembers.joinedAt,
          isActive: organizationMembers.isActive,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        })
        .from(organizationMembers)
        .leftJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, input.organizationId));

      // Fetch each member's farm assignments
      const userIds = members.map(m => m.userId);
      const orgFarms = await db.select().from(farms).where(eq(farms.organizationId, input.organizationId));
      const farmIds = orgFarms.map(f => f.id);

      const assignments = userIds.length > 0 && farmIds.length > 0
        ? await db
            .select({
              userId: farmMembers.userId,
              farmId: farmMembers.farmId,
              farmRole: farmMembers.farmRole,
              farmName: farms.name,
            })
            .from(farmMembers)
            .leftJoin(farms, eq(farmMembers.farmId, farms.id))
            .where(and(inArray(farmMembers.userId, userIds), inArray(farmMembers.farmId, farmIds)))
        : [];

      return members.map(m => ({
        ...m,
        farmAssignments: assignments.filter(a => a.userId === m.userId),
      }));
    }),

  inviteMember: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      email: z.string().email(),
      role: z.enum(["owner", "admin", "member"]).default("member"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { organizations, organizationMembers, users } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { checkUserLimit } = await import("../services/usageLimits");
      
      // Check caller is org admin/owner
      const [org] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      if (org.ownerId !== ctx.user.id) {
        const [membership] = await db.select().from(organizationMembers)
          .where(and(eq(organizationMembers.organizationId, input.organizationId), eq(organizationMembers.userId, ctx.user.id)))
          .limit(1);
        if (!membership || membership.role === "member") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can invite members" });
        }
      }

      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!existingUser) {
        // TODO: send email invite — for now we return a meaningful error
        throw new TRPCError({ code: "NOT_FOUND", message: "No user found with that email. They must register first." });
      }

      // Check if already a member
      const [existingMembership] = await db.select().from(organizationMembers)
        .where(and(eq(organizationMembers.organizationId, input.organizationId), eq(organizationMembers.userId, existingUser.id)))
        .limit(1);
      if (existingMembership) {
        throw new TRPCError({ code: "CONFLICT", message: "User is already a member of this organization" });
      }

      // Check usage limits
      try {
        await checkUserLimit(input.organizationId);
      } catch (err: any) {
        throw new TRPCError({ code: "FORBIDDEN", message: err.message });
      }

      await db.insert(organizationMembers).values({
        organizationId: input.organizationId,
        userId: existingUser.id,
        role: input.role,
      });

      return { success: true, userId: existingUser.id };
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({
      memberId: z.number(),
      organizationId: z.number(),
      role: z.enum(["owner", "admin", "member"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { organizationMembers, organizations } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [org] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
      if (!org || org.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner can change roles" });
      }

      await db.update(organizationMembers).set({ role: input.role }).where(eq(organizationMembers.id, input.memberId));
      return { success: true };
    }),

  deactivateMember: protectedProcedure
    .input(z.object({ memberId: z.number(), organizationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { organizationMembers, organizations } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [org] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
      if (!org || org.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner can deactivate members" });
      }

      await db.update(organizationMembers).set({ isActive: false }).where(eq(organizationMembers.id, input.memberId));
      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.number(), organizationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { organizationMembers, organizations } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [org] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
      if (!org || org.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner can remove members" });
      }

      await db.delete(organizationMembers).where(eq(organizationMembers.id, input.memberId));
      return { success: true };
    }),

  assignToFarm: protectedProcedure
    .input(z.object({
      userId: z.number(),
      farmId: z.number(),
      farmRole: z.enum(["owner", "administrator", "farm_manager", "worker", "veterinary_officer", "crop_officer", "viewer"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { farmMembers } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [existing] = await db.select().from(farmMembers)
        .where(and(eq(farmMembers.userId, input.userId), eq(farmMembers.farmId, input.farmId)))
        .limit(1);

      if (existing) {
        await db.update(farmMembers).set({ farmRole: input.farmRole }).where(eq(farmMembers.id, existing.id));
      } else {
        await db.insert(farmMembers).values({
          userId: input.userId,
          farmId: input.farmId,
          farmRole: input.farmRole,
          invitedByUserId: ctx.user.id,
        });
      }

      return { success: true };
    }),
});
