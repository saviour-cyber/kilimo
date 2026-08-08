import { adminProcedure, publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscriptionPlans, subscriptionPlanFeatures, subscriptions, subscriptionPayments, organizations, auditLogs } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
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

      await db.update(subscriptions)
        .set({ planId: input.newPlanId })
        .where(eq(subscriptions.id, input.subscriptionId));

      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "changed_subscription_plan",
        entityType: "subscription",
        entityId: input.subscriptionId,
        metadata: { newPlanId: input.newPlanId },
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
