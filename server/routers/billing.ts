import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscriptionPlans, subscriptionPlanFeatures, subscriptionPayments } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { getPaymentGateway } from "../services/billing";
import { requireOrganizationBillingPermission } from "../services/authorization";

export const billingRouter = router({
  listPublicPlans: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Only return active plans
    const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(subscriptionPlans.sortOrder);
    const features = await db.select().from(subscriptionPlanFeatures);

    return plans.map((plan) => ({
      ...plan,
      features: features.filter((f) => f.planId === plan.id),
    }));
  }),

  createCheckoutSession: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      planId: z.number(),
      billingInterval: z.enum(["monthly", "yearly"]),
      provider: z.enum(["stripe", "mpesa"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // SECURITY: Verify that the user has permission to manage billing for this organization
      await requireOrganizationBillingPermission(db, ctx.user.id, input.organizationId);

      // Create checkout session using selected provider
      const gateway = getPaymentGateway(input.provider);
      
      const appBaseUrl = process.env.APP_BASE_URL || "https://kilimohub.onrender.com";

      const session = await gateway.createCheckoutSession({
        organizationId: input.organizationId,
        planId: input.planId,
        billingInterval: input.billingInterval,
        successUrl: `${appBaseUrl}/settings/organization/billing?checkout=success`,
        cancelUrl: `${appBaseUrl}/settings/organization/billing?checkout=cancelled`,
        customerEmail: ctx.user.email || undefined,
        customerName: ctx.user.name || undefined,
      });

      return session;
    }),

  listMyPayments: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // SECURITY: Verify that the user has permission to view billing for this organization
      await requireOrganizationBillingPermission(db, ctx.user.id, input.organizationId);

      return db
        .select()
        .from(subscriptionPayments)
        .where(eq(subscriptionPayments.organizationId, input.organizationId))
        .orderBy(desc(subscriptionPayments.createdAt));
    }),
});
