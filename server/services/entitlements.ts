/**
 * Entitlement Service
 *
 * This service is the SINGLE SOURCE OF TRUTH for subscription-based access control.
 * It checks whether an organization's active subscription grants access to a specific
 * module or service key.
 *
 * DO NOT scatter `if (plan === 'professional')` checks throughout the codebase.
 * All access checks should go through this service.
 */

import { eq } from "drizzle-orm";
import { subscriptions, subscriptionPlanFeatures } from "../../drizzle/schema";
import type { MySql2Database } from "drizzle-orm/mysql2";

export type EntitlementResult =
  | { granted: true }
  | { granted: false; reason: "no_subscription" | "subscription_inactive" | "feature_not_in_plan" };

/**
 * Checks whether an organization is entitled to a given feature key.
 *
 * @param db       - The Drizzle database instance
 * @param orgId    - The organization ID to check
 * @param featureKey - The module or service key (e.g. "crop", "iot", "ai_assistant")
 */
export async function checkEntitlement(
  db: MySql2Database<any> & { query: any },
  orgId: number,
  featureKey: string
): Promise<EntitlementResult> {
  // Fetch the organization's active subscription
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);

  if (!sub) {
    return { granted: false, reason: "no_subscription" };
  }

  // Check subscription is in an active state
  const activeStates = ["trialing", "active"];
  if (!activeStates.includes(sub.status)) {
    return { granted: false, reason: "subscription_inactive" };
  }

  // Fetch the features for this plan
  const features = await db
    .select()
    .from(subscriptionPlanFeatures)
    .where(eq(subscriptionPlanFeatures.planId, sub.planId));

  const hasFeature = features.some((f) => f.featureKey === featureKey);

  if (!hasFeature) {
    return { granted: false, reason: "feature_not_in_plan" };
  }

  return { granted: true };
}

/**
 * Asserts entitlement and throws a TRPCError if not granted.
 * Use this inside tRPC procedures to gate access.
 *
 * @example
 * await assertEntitlement(ctx.db, orgId, "iot");
 */
export async function assertEntitlement(
  db: MySql2Database<any> & { query: any },
  orgId: number,
  featureKey: string
): Promise<void> {
  const { TRPCError } = await import("@trpc/server");
  const result = await checkEntitlement(db, orgId, featureKey);

  if (!result.granted) {
    const messageMap: Record<string, string> = {
      no_subscription: "Your organization does not have an active subscription.",
      subscription_inactive: "Your organization's subscription is not active. Please contact your billing administrator.",
      feature_not_in_plan: `Your current plan does not include access to this feature. Please upgrade your subscription.`,
    };

    throw new TRPCError({
      code: "FORBIDDEN",
      message: messageMap[result.reason] ?? "Access denied.",
    });
  }
}

/**
 * Returns the full list of feature keys granted to an organization.
 * Useful for sending to the frontend to determine which modules to show.
 */
export async function getGrantedFeatures(
  db: MySql2Database<any> & { query: any },
  orgId: number
): Promise<string[]> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);

  if (!sub) return [];

  const activeStates = ["trialing", "active"];
  if (!activeStates.includes(sub.status)) return [];

  const features = await db
    .select()
    .from(subscriptionPlanFeatures)
    .where(eq(subscriptionPlanFeatures.planId, sub.planId));

  return features.map((f) => f.featureKey);
}
