import type { Request, Response } from "express";
import { getDb } from "../db";
import { subscriptions, organizations } from "../../drizzle/schema";
import { eq, lt, and, sql } from "drizzle-orm";
import { emailService } from "../services/email";

export async function enforceSubscriptionsHandler(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const now = new Date();

    // 1. Mark trialing -> expired
    const expiredTrials = await db
      .update(subscriptions)
      .set({ status: "expired" })
      .where(and(eq(subscriptions.status, "trialing"), lt(subscriptions.trialEndsAt, now)));
      
    // If we wanted to, we could fetch these before updating to send emails, 
    // but for simplicity we'll just execute the query. A robust system would SELECT then UPDATE.

    // 2. Mark active -> past_due
    const newlyPastDue = await db
      .select({ subId: subscriptions.id, orgId: subscriptions.organizationId, email: organizations.contactEmail, name: organizations.name })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .where(and(eq(subscriptions.status, "active"), lt(subscriptions.currentPeriodEnd, now)));

    if (newlyPastDue.length > 0) {
      await db
        .update(subscriptions)
        .set({ status: "past_due" })
        .where(and(eq(subscriptions.status, "active"), lt(subscriptions.currentPeriodEnd, now)));

      for (const org of newlyPastDue) {
        if (org.email) {
          try {
            await emailService.send({
              to: { email: org.email, name: org.name || undefined },
              subject: "SproutX Subscription Past Due",
              html: `<p>Hi ${org.name || 'there'},</p><p>Your SproutX subscription is past due. Please update your payment method to avoid suspension in 7 days.</p>`,
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
      .select({ subId: subscriptions.id, orgId: subscriptions.organizationId, email: organizations.contactEmail, name: organizations.name })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .where(and(
        eq(subscriptions.status, "past_due"), 
        // We assume they became past_due when currentPeriodEnd passed. 
        // So if currentPeriodEnd is more than 7 days ago, the grace period is over.
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
            await emailService.send({
              to: { email: org.email, name: org.name || undefined },
              subject: "SproutX Subscription Suspended",
              html: `<p>Hi ${org.name || 'there'},</p><p>Your SproutX subscription has been suspended due to non-payment. Please log in and update your payment method to restore access.</p>`,
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
