import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import {
  users, organizations, organizationMembers, farms, farmModules, farmMembers,
  subscriptionPlans, subscriptions,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { emailService } from "../services/email";

export const onboardingRouter = router({
  /**
   * Returns active subscription plans for the onboarding wizard.
   * Public — no auth required.
   */
  getActivePlans: publicProcedure.query(async ({ ctx }) => {
    const { subscriptionPlanFeatures } = await import("../../drizzle/schema");
    const { eq: drizzleEq } = await import("drizzle-orm");
    const plans = await ctx.db
      .select()
      .from(subscriptionPlans)
      .where(drizzleEq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);

    const features = await ctx.db.select().from(subscriptionPlanFeatures);

    return plans.map((p) => ({
      ...p,
      features: features.filter((f) => f.planId === p.id),
    }));
  }),

  setup: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        // Org fields
        orgName: z.string(),
        businessType: z.string(),
        country: z.string(),
        county: z.string().optional(),
        currency: z.string(),
        timezone: z.string(),
        // Plan selection
        planId: z.number(),
        billingInterval: z.enum(["monthly", "yearly"]).default("monthly"),
        // Farm fields
        farmName: z.string(),
        farmSize: z.number(),
        unit: z.string(),
        modules: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Verify the selected plan exists and is active
        const [plan] = await ctx.db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, input.planId))
          .limit(1);

        if (!plan || !plan.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The selected plan is no longer available. Please choose another plan.",
          });
        }

        // 2. Create Organization
        const [orgResult] = await ctx.db.insert(organizations).values({
          name: input.orgName,
          businessType: input.businessType,
          country: input.country,
          county: input.county,
          currency: input.currency,
          timezone: input.timezone,
          ownerId: input.userId,
        });

        const orgId = orgResult.insertId;

        // 3a. Add the founding user as an organization owner member
        await ctx.db.insert(organizationMembers).values({
          organizationId: orgId,
          userId: input.userId,
          role: "owner",
          isActive: true,
        });

        // 3. Provision trial subscription with the user-selected plan
        const trialDays = plan.trialDays ?? 14;
        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

        await ctx.db.insert(subscriptions).values({
          organizationId: orgId,
          planId: plan.id,
          status: "trialing",
          billingInterval: input.billingInterval,
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
        });

        // 4. Send trial started email (non-blocking)
        const [user] = await ctx.db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);

        if (user?.email) {
          emailService
            .sendTrialStartedEmail(
              { name: user.name || "Farmer", email: user.email },
              {
                organizationName: input.orgName,
                planName: plan.name,
                trialDays,
                expiresAt: trialEndsAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }),
              }
            )
            .catch((e) =>
              console.error("[Onboarding] Failed to send trial email:", e)
            );
        }

        // 5. Create Farm
        const sizeHectares =
          input.unit === "Acres"
            ? (input.farmSize * 0.404686).toString()
            : input.farmSize.toString();

        const [farmResult] = await ctx.db.insert(farms).values({
          organizationId: orgId,
          name: input.farmName,
          sizeHectares,
          currency: input.currency,
          timezone: input.timezone,
          ownerId: input.userId,
        });

        const farmId = farmResult.insertId;

        // 6. Add user as farm owner
        await ctx.db.insert(farmMembers).values({
          farmId,
          userId: input.userId,
          farmRole: "owner",
          isActive: true,
        });

        // 7. Provision ALL modules granted by the plan into farmModules.
        // The subscription plan is the source of truth for entitlement.
        // We fetch the plan's features and enable all module-type features automatically.
        // The user's wizard selections (input.modules) are respected but the plan always wins.
        const { subscriptionPlanFeatures: planFeaturesTable } = await import("../../drizzle/schema");
        const planFeatures = await ctx.db
          .select()
          .from(planFeaturesTable)
          .where(eq(planFeaturesTable.planId, plan.id));

        // Always-on core modules regardless of plan
        const coreModules = ["dashboard", "settings", "tasks", "notifications"];

        // All module-type features from the plan
        const planModuleKeys = planFeatures
          .filter((f) => f.featureType === "module")
          .map((f) => f.featureKey);

        // Union of core + plan modules, deduplicated
        const allModulesToProvision = Array.from(new Set([...coreModules, ...planModuleKeys]));

        if (allModulesToProvision.length > 0) {
          await ctx.db.insert(farmModules).values(
            allModulesToProvision.map((mod) => ({
              farmId,
              moduleKey: mod,
              isEnabled: true,
              enabledByUserId: input.userId,
            }))
          );
        }

        return { success: true, orgId, farmId };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        console.error("Onboarding setup failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete onboarding setup",
        });
      }
    }),
});
