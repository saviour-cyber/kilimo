/**
 * Subscription Provisioning Service
 *
 * Provisions a trial subscription for a newly created organization.
 * The default trial plan is determined by the `isDefaultTrial` flag on subscriptionPlans
 * — controlled by the Platform Admin, not hardcoded in application code.
 *
 * An explicit `planId` can be passed to override the default (e.g. from the onboarding wizard
 * where the user selected a specific plan).
 */

import { eq } from "drizzle-orm";
import { subscriptionPlans, subscriptions, organizations, users } from "../../drizzle/schema";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { emailService } from "./email";

export async function provisionTrialSubscription(
  db: MySql2Database<any> & { query: any },
  orgId: number,
  planId?: number   // optional override — if not provided, uses isDefaultTrial plan
): Promise<void> {
  // Resolve plan: use explicit planId if given, else find the default trial plan
  let plan;
  if (planId) {
    const [found] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);
    plan = found;
  } else {
    const [found] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isDefaultTrial, true))
      .limit(1);
    plan = found;
  }

  if (!plan) {
    console.warn(
      planId
        ? `[Subscriptions] Plan id=${planId} not found. Skipping trial provisioning.`
        : "[Subscriptions] No plan marked as isDefaultTrial=true. Skipping trial provisioning. " +
          "Go to Admin → Subscriptions → Plans and mark a plan as the default trial plan."
    );
    return;
  }

  const trialDays = plan.trialDays ?? 14;
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  await db.insert(subscriptions).values({
    organizationId: orgId,
    planId: plan.id,
    status: "trialing",
    billingInterval: "monthly",
    trialEndsAt,
    currentPeriodStart: now,
    currentPeriodEnd: trialEndsAt,
  });

  // Fetch org owner to send welcome/trial email
  const [orgData] = await db
    .select({
      orgName: organizations.name,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(organizations)
    .innerJoin(users, eq(organizations.ownerId, users.id))
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (orgData?.ownerEmail) {
    try {
      await emailService.sendTrialStartedEmail(
        { name: orgData.ownerName || "Farmer", email: orgData.ownerEmail },
        {
          organizationName: orgData.orgName,
          planName: plan.name,
          trialDays,
          expiresAt: trialEndsAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        }
      );
    } catch (e) {
      console.error("[Subscriptions] Failed to send trial started email", e);
    }
  }
}
