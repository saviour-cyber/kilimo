import { eq } from "drizzle-orm";
import { subscriptionPlans, subscriptions, organizations, users } from "../../drizzle/schema";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { emailService } from "./email";

/**
 * Provisions a default trial subscription for a newly created organization.
 * Uses the "Starter" plan if available.
 */
export async function provisionTrialSubscription(
  db: MySql2Database<any> & { query: any },
  orgId: number
): Promise<void> {
  const [starterPlan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, "Starter"))
    .limit(1);

  if (!starterPlan) {
    console.warn("No 'Starter' plan found in database. Skipping trial provisioning.");
    return;
  }

  const trialDays = starterPlan.trialDays ?? 14;
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  await db.insert(subscriptions).values({
    organizationId: orgId,
    planId: starterPlan.id,
    status: "trialing",
    billingInterval: "monthly",
    trialEndsAt,
    currentPeriodStart: now,
    currentPeriodEnd: trialEndsAt,
  });

  // Fetch org and owner to send email
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

  if (orgData && orgData.ownerEmail) {
    try {
      await emailService.sendTrialStartedEmail(
        { name: orgData.ownerName || "Farmer", email: orgData.ownerEmail },
        {
          organizationName: orgData.orgName,
          planName: starterPlan.name,
          trialDays,
          expiresAt: trialEndsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        }
      );
    } catch (e) {
      console.error("[Subscriptions] Failed to send trial started email", e);
    }
  }
}
