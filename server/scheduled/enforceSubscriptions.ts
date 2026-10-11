import type { Request, Response } from "express";
import { getDb } from "../db";
import { subscriptions, organizations, subscriptionPlans, emailAutomationLogs } from "../../drizzle/schema";
import { eq, lt, and, sql } from "drizzle-orm";
import { emailService } from "../services/email";

export async function enforceSubscriptionsHandler(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const now = new Date();

    // 1. Mark trialing -> expired (Fetch first so we can notify them)
    const expiringTrials = await db
      .select({
        subId: subscriptions.id,
        orgId: subscriptions.organizationId,
        email: organizations.contactEmail,
        orgName: organizations.name,
        planName: subscriptionPlans.name,
      })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(eq(subscriptions.status, "trialing"), lt(subscriptions.trialEndsAt, now)));

    const expiredTrials = await db
      .update(subscriptions)
      .set({ status: "expired" })
      .where(and(eq(subscriptions.status, "trialing"), lt(subscriptions.trialEndsAt, now)));

    // Send trial expired notifications with dedup
    for (const item of expiringTrials) {
      if (item.email) {
        try {
          const [alreadySent] = await db
            .select()
            .from(emailAutomationLogs)
            .where(
              and(
                eq(emailAutomationLogs.organizationId, item.orgId),
                eq(emailAutomationLogs.automationType, "trial_expired")
              )
            )
            .limit(1);

          if (!alreadySent) {
            await emailService.sendTrialExpiredEmail(
              { email: item.email, name: item.orgName || "Farmer" },
              { organizationName: item.orgName, planName: item.planName || "Trial" }
            );

            await db.insert(emailAutomationLogs).values({
              organizationId: item.orgId,
              recipientEmail: item.email,
              automationType: "trial_expired",
              status: "sent",
            });
          }
        } catch (e: any) {
          console.error(`[Subscription Enforcer] Failed to send trial_expired email to ${item.email}:`, e);
        }
      }
    }

    // 2. Mark active -> past_due
    const newlyPastDue = await db
      .select({
        subId: subscriptions.id,
        orgId: subscriptions.organizationId,
        email: organizations.contactEmail,
        name: organizations.name,
        planName: subscriptionPlans.name,
      })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(eq(subscriptions.status, "active"), lt(subscriptions.currentPeriodEnd, now)));

    if (newlyPastDue.length > 0) {
      await db
        .update(subscriptions)
        .set({ status: "past_due" })
        .where(and(eq(subscriptions.status, "active"), lt(subscriptions.currentPeriodEnd, now)));

      for (const org of newlyPastDue) {
        if (org.email) {
          try {
            await emailService.sendSubscriptionPastDueEmail(
              { email: org.email, name: org.name || "Subscriber" },
              { organizationName: org.name, planName: org.planName || "Subscription" }
            );
            await db.insert(emailAutomationLogs).values({
              organizationId: org.orgId,
              recipientEmail: org.email,
              automationType: "subscription_past_due",
              status: "sent",
            });
            console.log(`[Subscription Enforcer] Sent past_due email to ${org.email}`);
          } catch (e) {
            console.error(`[Subscription Enforcer] Failed to send past_due email to ${org.email}`, e);
          }
        }
      }
    }

    // 3. Mark past_due -> suspended (after 7 days grace period)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newlySuspended = await db
      .select({
        subId: subscriptions.id,
        orgId: subscriptions.organizationId,
        email: organizations.contactEmail,
        name: organizations.name,
        planName: subscriptionPlans.name,
      })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(subscriptions.status, "past_due"),
        lt(subscriptions.currentPeriodEnd, sevenDaysAgo)
      ));

    if (newlySuspended.length > 0) {
      await db
        .update(subscriptions)
        .set({ status: "suspended" })
        .where(and(
          eq(subscriptions.status, "past_due"),
          lt(subscriptions.currentPeriodEnd, sevenDaysAgo)
        ));

      for (const org of newlySuspended) {
        if (org.email) {
          try {
            await emailService.sendSubscriptionSuspendedEmail(
              { email: org.email, name: org.name || "Subscriber" },
              { organizationName: org.name, planName: org.planName || "Subscription" }
            );
            await db.insert(emailAutomationLogs).values({
              organizationId: org.orgId,
              recipientEmail: org.email,
              automationType: "subscription_suspended",
              status: "sent",
            });
            console.log(`[Subscription Enforcer] Sent suspended email to ${org.email}`);
          } catch (e) {
            console.error(`[Subscription Enforcer] Failed to send suspended email to ${org.email}`, e);
          }
        }
      }
    }

    res.json({
      success: true,
      results: {
        expiredTrials: expiredTrials[0].affectedRows,
        markedPastDue: newlyPastDue.length,
        markedSuspended: newlySuspended.length,
      },
    });
  } catch (error: any) {
    console.error("[Subscription Enforcer] Error:", error);
    res.status(500).json({ error: error.message });
  }
}
