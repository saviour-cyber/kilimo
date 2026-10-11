import type { Request, Response } from "express";
import { getDb } from "../db";
import {
  subscriptions,
  organizations,
  subscriptionPlans,
  users,
  emailAutomationLogs,
} from "../../drizzle/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { emailService } from "../services/email";

/**
 * Scheduled handler for automated billing communications.
 * Runs daily via cron (or Heartbeat /api/scheduled/billing-email-reminders).
 *
 * Rules handled:
 * 1. Trial ending in 7 days
 * 2. Trial ending in 3 days
 * 3. Trial ending in 1 day
 * 4. Upcoming renewal reminder (3 days before active period ends)
 */
export async function billingEmailRemindersHandler(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const now = new Date();
    const stats = {
      trial7dSent: 0,
      trial3dSent: 0,
      trial1dSent: 0,
      renewalSent: 0,
      skipped: 0,
      errors: 0,
    };

    // Helper: Find org billing recipient (contactEmail preferred, owner's user email as fallback)
    const activeTrialing = await db
      .select({
        subId: subscriptions.id,
        orgId: subscriptions.organizationId,
        trialEndsAt: subscriptions.trialEndsAt,
        orgName: organizations.name,
        contactEmail: organizations.contactEmail,
        ownerId: organizations.ownerId,
        ownerEmail: users.email,
        ownerName: users.name,
        planName: subscriptionPlans.name,
      })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .leftJoin(users, eq(organizations.ownerId, users.id))
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.status, "trialing"));

    for (const item of activeTrialing) {
      if (!item.trialEndsAt) continue;

      const recipientEmail = item.contactEmail || item.ownerEmail;
      const recipientName = item.ownerName || item.orgName || "Farmer";
      if (!recipientEmail) continue;

      const msUntilExpiry = new Date(item.trialEndsAt).getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

      // Target intervals: 7 days, 3 days, 1 day
      let targetDays: number | null = null;
      if (daysUntilExpiry === 7) targetDays = 7;
      else if (daysUntilExpiry === 3) targetDays = 3;
      else if (daysUntilExpiry === 1) targetDays = 1;

      if (!targetDays) continue;

      const automationType = `trial_ending_${targetDays}d`;

      // Dedup check: did we already send this automationType to this org in the last 24h?
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const [existingLog] = await db
        .select()
        .from(emailAutomationLogs)
        .where(
          and(
            eq(emailAutomationLogs.organizationId, item.orgId),
            eq(emailAutomationLogs.automationType, automationType),
            gte(emailAutomationLogs.sentAt, oneDayAgo)
          )
        )
        .limit(1);

      if (existingLog) {
        stats.skipped++;
        continue;
      }

      // Check user preferences if owner is resolved
      if (item.ownerId) {
        const canSend = await emailService.isUserOptedIn(item.ownerId, "billing");
        if (!canSend) {
          stats.skipped++;
          continue;
        }
      }

      try {
        const expiresFormatted = new Date(item.trialEndsAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        const sendResult = await emailService.sendTrialEndingEmail(
          { name: recipientName, email: recipientEmail },
          {
            organizationName: item.orgName,
            planName: item.planName || "Trial",
            daysRemaining: targetDays,
            expiresAt: expiresFormatted,
          }
        );

        await db.insert(emailAutomationLogs).values({
          organizationId: item.orgId,
          userId: item.ownerId || undefined,
          recipientEmail,
          automationType,
          status: sendResult.success ? "sent" : "failed",
          errorMessage: sendResult.error,
          metadata: { daysRemaining: targetDays, expiresAt: item.trialEndsAt },
        });

        if (sendResult.success) {
          if (targetDays === 7) stats.trial7dSent++;
          else if (targetDays === 3) stats.trial3dSent++;
          else if (targetDays === 1) stats.trial1dSent++;
        } else {
          stats.errors++;
        }
      } catch (err: any) {
        stats.errors++;
        console.error(`[Billing Reminders] Failed to send ${automationType} to ${recipientEmail}:`, err);
      }
    }

    // ── 2. Upcoming Renewal / Expiry (for active subscriptions ending in 3 days) ──
    const expiringActive = await db
      .select({
        subId: subscriptions.id,
        orgId: subscriptions.organizationId,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        billingInterval: subscriptions.billingInterval,
        orgName: organizations.name,
        contactEmail: organizations.contactEmail,
        ownerId: organizations.ownerId,
        ownerEmail: users.email,
        ownerName: users.name,
        planName: subscriptionPlans.name,
        monthlyPrice: subscriptionPlans.monthlyPrice,
        yearlyPrice: subscriptionPlans.yearlyPrice,
        currency: subscriptionPlans.currency,
      })
      .from(subscriptions)
      .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .leftJoin(users, eq(organizations.ownerId, users.id))
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.status, "active"));

    for (const item of expiringActive) {
      if (!item.currentPeriodEnd) continue;

      const recipientEmail = item.contactEmail || item.ownerEmail;
      const recipientName = item.ownerName || item.orgName || "Subscriber";
      if (!recipientEmail) continue;

      const msUntilEnd = new Date(item.currentPeriodEnd).getTime() - now.getTime();
      const daysUntilEnd = Math.ceil(msUntilEnd / (1000 * 60 * 60 * 24));

      if (daysUntilEnd !== 3) continue;

      const automationType = "renewal_reminder_3d";
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [existingLog] = await db
        .select()
        .from(emailAutomationLogs)
        .where(
          and(
            eq(emailAutomationLogs.organizationId, item.orgId),
            eq(emailAutomationLogs.automationType, automationType),
            gte(emailAutomationLogs.sentAt, oneDayAgo)
          )
        )
        .limit(1);

      if (existingLog) {
        stats.skipped++;
        continue;
      }

      try {
        const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
        const paymentUrl = `${base}/settings/organization/billing`;
        const expiryFormatted = new Date(item.currentPeriodEnd).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        const price = item.billingInterval === "yearly" ? item.yearlyPrice : item.monthlyPrice;
        const formattedAmount = `${item.currency || 'KES'} ${price || '0'}`;

        const sendResult = await emailService.sendPaymentReminder(
          { name: recipientName, email: recipientEmail },
          {
            planName: item.planName || "Subscription",
            amount: formattedAmount,
            expiryDate: expiryFormatted,
            paymentUrl,
          }
        );

        await db.insert(emailAutomationLogs).values({
          organizationId: item.orgId,
          userId: item.ownerId || undefined,
          recipientEmail,
          automationType,
          status: sendResult.success ? "sent" : "failed",
          errorMessage: sendResult.error,
          metadata: { daysRemaining: 3, currentPeriodEnd: item.currentPeriodEnd },
        });

        if (sendResult.success) stats.renewalSent++;
        else stats.errors++;
      } catch (err: any) {
        stats.errors++;
        console.error(`[Billing Reminders] Failed to send renewal reminder to ${recipientEmail}:`, err);
      }
    }

    res.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
    });
  } catch (error: any) {
    console.error("[billingEmailRemindersHandler] Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
