import { adminProcedure, publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscriptionPlans, subscriptionPlanFeatures, subscriptions, subscriptionPayments, organizations, auditLogs, farms, farmModules } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, desc, ne } from "drizzle-orm";
import { z } from "zod";
import { getGrantedFeatures } from "../services/entitlements";

export const subscriptionsRouter = router({
  listPlans: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.sortOrder);
    const features = await db.select().from(subscriptionPlanFeatures);

    return plans.map((plan) => ({
      ...plan,
      features: features.filter((f) => f.planId === plan.id),
    }));
  }),

  createPlan: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      monthlyPrice: z.number().min(0),
      yearlyPrice: z.number().min(0),
      currency: z.string().min(1).default("KES"),
      trialDays: z.number().min(0).default(14),
      maxFarms: z.number().nullable().optional(),
      maxUsers: z.number().nullable().optional(),
      maxDevices: z.number().nullable().optional(),
      maxStorageMb: z.number().nullable().optional(),
      isActive: z.boolean().default(true),
      isRecommended: z.boolean().default(false),
      isDefaultTrial: z.boolean().default(false),
      sortOrder: z.number().default(0),
      features: z.array(z.object({
        featureKey: z.string(),
        featureType: z.enum(["module", "service"])
      })).default([]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { features, ...planData } = input;

      // If this plan is being set as default trial, unset all others first
      if (planData.isDefaultTrial) {
        await db.update(subscriptionPlans).set({ isDefaultTrial: false });
      }

      const [insertResult] = await db.insert(subscriptionPlans).values({
        ...planData,
        monthlyPrice: planData.monthlyPrice.toString(),
        yearlyPrice: planData.yearlyPrice.toString(),
      });

      const planId = insertResult.insertId;

      if (features.length > 0) {
        await db.insert(subscriptionPlanFeatures).values(
          features.map(f => ({
            planId,
            featureKey: f.featureKey,
            featureType: f.featureType,
          }))
        );
      }

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "created_subscription_plan",
        entityType: "subscriptionPlan",
        entityId: planId,
        metadata: { name: planData.name },
      });

      return { success: true, planId };
    }),

  updatePlan: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      description: z.string().nullable().optional(),
      monthlyPrice: z.number().min(0),
      yearlyPrice: z.number().min(0),
      currency: z.string().min(1),
      trialDays: z.number().min(0),
      maxFarms: z.number().nullable().optional(),
      maxUsers: z.number().nullable().optional(),
      maxDevices: z.number().nullable().optional(),
      maxStorageMb: z.number().nullable().optional(),
      isActive: z.boolean(),
      isRecommended: z.boolean().default(false),
      isDefaultTrial: z.boolean().default(false),
      sortOrder: z.number(),
      features: z.array(z.object({
        featureKey: z.string(),
        featureType: z.enum(["module", "service"])
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, features, ...planData } = input;

      // If this plan is being set as default trial, unset all others first
      if (planData.isDefaultTrial) {
        await db.update(subscriptionPlans)
          .set({ isDefaultTrial: false })
          .where(ne(subscriptionPlans.id, id));
      }

      await db.update(subscriptionPlans).set({
        ...planData,
        monthlyPrice: planData.monthlyPrice.toString(),
        yearlyPrice: planData.yearlyPrice.toString(),
      }).where(eq(subscriptionPlans.id, id));

      // Recreate features
      await db.delete(subscriptionPlanFeatures).where(eq(subscriptionPlanFeatures.planId, id));
      if (features.length > 0) {
        await db.insert(subscriptionPlanFeatures).values(
          features.map(f => ({
            planId: id,
            featureKey: f.featureKey,
            featureType: f.featureType,
          }))
        );
      }

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "updated_subscription_plan",
        entityType: "subscriptionPlan",
        entityId: id,
        metadata: { name: planData.name },
      });

      return { success: true };
    }),

  /** Admin shortcut: set one plan as the default trial and unset all others atomically */
  setDefaultTrialPlan: adminProcedure
    .input(z.object({ planId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(subscriptionPlans).set({ isDefaultTrial: false });
      await db.update(subscriptionPlans)
        .set({ isDefaultTrial: true })
        .where(eq(subscriptionPlans.id, input.planId));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "set_default_trial_plan",
        entityType: "subscriptionPlan",
        entityId: input.planId,
        metadata: {},
      });

      return { success: true };
    }),

  listSubscriptions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const subs = await db.select({
      subscription: subscriptions,
      organization: organizations,
      plan: subscriptionPlans,
    })
    .from(subscriptions)
    .leftJoin(organizations, eq(subscriptions.organizationId, organizations.id))
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .orderBy(desc(subscriptions.createdAt));

    return subs;
  }),

  updateSubscriptionStatus: adminProcedure
    .input(z.object({
      subscriptionId: z.number(),
      status: z.enum(["trialing", "active", "past_due", "cancelled", "expired", "suspended"]),
      cancelReason: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { subscriptionId, status, cancelReason } = input;

      await db.update(subscriptions)
        .set({ 
          status, 
          cancelReason: cancelReason || null,
          cancelledAt: status === "cancelled" ? new Date() : null
        })
        .where(eq(subscriptions.id, subscriptionId));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "updated_subscription_status",
        entityType: "subscription",
        entityId: subscriptionId,
        metadata: { newStatus: status, reason: cancelReason },
      });

      return { success: true };
    }),

  changeSubscriptionPlan: adminProcedure
    .input(z.object({
      subscriptionId: z.number(),
      newPlanId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 1. Fetch the subscription to get the orgId
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, input.subscriptionId))
        .limit(1);

      if (!sub) throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found." });

      // 2. Update the plan
      await db.update(subscriptions)
        .set({ planId: input.newPlanId })
        .where(eq(subscriptions.id, input.subscriptionId));

      // 3. Reconcile farmModules for all farms in this org.
      // Fetch the new plan's module-type features.
      const newPlanFeatures = await db
        .select()
        .from(subscriptionPlanFeatures)
        .where(eq(subscriptionPlanFeatures.planId, input.newPlanId));

      const newModuleKeys = newPlanFeatures
        .filter((f) => f.featureType === "module")
        .map((f) => f.featureKey);

      // Always-on core modules
      const coreModules = ["dashboard", "settings", "tasks", "notifications"];
      const allModuleKeys = Array.from(new Set([...coreModules, ...newModuleKeys]));

      // Get all farms in this org
      const orgFarms = await db
        .select({ id: farms.id })
        .from(farms)
        .where(eq(farms.organizationId, sub.organizationId));

      // For each farm, upsert missing module rows as isEnabled=true.
      // We do NOT delete rows for modules no longer in the plan — downgrade
      // is enforced at runtime by getGrantedFeatures(). This preserves config
      // so if the org upgrades again, previous settings are restored.
      for (const farm of orgFarms) {
        const existingModules = await db
          .select({ moduleKey: farmModules.moduleKey })
          .from(farmModules)
          .where(eq(farmModules.farmId, farm.id));

        const existingKeys = new Set(existingModules.map((m) => m.moduleKey));
        const missingKeys = allModuleKeys.filter((k) => !existingKeys.has(k));

        if (missingKeys.length > 0) {
          await db.insert(farmModules).values(
            missingKeys.map((mod) => ({
              farmId: farm.id,
              moduleKey: mod,
              isEnabled: true,
              enabledByUserId: ctx.user.id,
            }))
          );
        }
      }

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "changed_subscription_plan",
        entityType: "subscription",
        entityId: input.subscriptionId,
        metadata: { newPlanId: input.newPlanId, reconciledFarms: orgFarms.length },
      });

      return { success: true };
    }),

  getOrganizationSubscription: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const [sub] = await db.select({
        subscription: subscriptions,
        plan: subscriptionPlans,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.organizationId, input.organizationId))
      .limit(1);

      if (!sub) return null;

      const features = await db.select()
        .from(subscriptionPlanFeatures)
        .where(eq(subscriptionPlanFeatures.planId, sub.plan!.id));

      return {
        ...sub,
        features
      };
    }),

  /**
   * Returns the list of feature keys (module/service keys) that the org's
   * active subscription grants. Used by the frontend to gate module visibility.
   */
  getGrantedFeatures: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return getGrantedFeatures(db, input.organizationId);
    }),

  listPayments: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const payments = await db.select({
      payment: subscriptionPayments,
      organization: organizations,
      plan: subscriptionPlans,
    })
    .from(subscriptionPayments)
    .leftJoin(organizations, eq(subscriptionPayments.organizationId, organizations.id))
    .leftJoin(subscriptions, eq(subscriptionPayments.subscriptionId, subscriptions.id))
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .orderBy(desc(subscriptionPayments.createdAt));

    return payments;
  }),

  listPastDue: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const pastDue = await db.select({
      subscription: subscriptions,
      organization: organizations,
      plan: subscriptionPlans,
    })
    .from(subscriptions)
    .leftJoin(organizations, eq(subscriptions.organizationId, organizations.id))
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(eq(subscriptions.status, "past_due"))
    .orderBy(desc(subscriptions.updatedAt));

    return pastDue;
  }),
});
