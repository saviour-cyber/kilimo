// ─── EmailService ─────────────────────────────────────────────────────────────
// Provider-agnostic email service for KiliSense.
// Switching providers requires only an environment variable change.
//
// Configuration (environment variables):
//   EMAIL_PROVIDER      = resend | brevo | console   (default: console)
//   RESEND_API_KEY      = re_xxxxxxxxxxxx             (required for resend)
//   BREVO_API_KEY       = xkeysib-xxxxxxxxxxxx        (required for brevo)
//   EMAIL_FROM_ADDRESS  = noreply@kilisense.co.ke     (default sender address)
//   EMAIL_FROM_NAME     = KiliSense                   (default sender name)
//   APP_BASE_URL        = https://kilisense.onrender.com

import type { IEmailProvider, SendEmailOptions, SendEmailResult } from "./types";
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  welcomeEmailTemplate,
  farmInviteTemplate,
  organizationInviteTemplate,
  platformAnnouncementTemplate,
  paymentReminderTemplate,
  securityAlertTemplate,
  trialStartedEmailTemplate,
  trialEndingTemplate,
  trialExpiredTemplate,
  subscriptionPastDueTemplate,
  subscriptionSuspendedTemplate,
  paymentSuccessTemplate,
  paymentFailedTemplate,
  planChangedTemplate,
  usageLimitWarningTemplate,
  farmDigestTemplate,
  regionalAgriInsightTemplate,
} from "./templates";
import { getDb } from "../../db";
import { platformEmailLogs, userEmailPreferences } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

export class EmailService {
  private provider: IEmailProvider;

  constructor(provider: IEmailProvider) {
    this.provider = provider;
    console.log(`[EmailService] Initialized with provider: ${provider.name}`);
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  // ── Low-level send ───────────────────────────────────────────────────────────

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const defaultFrom = {
      name: process.env.EMAIL_FROM_NAME ?? "KiliSense",
      email: process.env.EMAIL_FROM_ADDRESS ?? "noreply@kilisense.co.ke",
    };

    const result = await this.provider.send({
      from: defaultFrom,
      ...options,
    });

    // Log to platformEmailLogs
    try {
      const db = await getDb();
      if (db) {
        const recipients = Array.isArray(options.to) ? options.to : [options.to];
        for (const recipient of recipients) {
          await db.insert(platformEmailLogs).values({
            senderId: options.senderId,
            recipient: recipient.email,
            subject: options.subject,
            templateKey: options.templateKey ?? "custom",
            status: result.success ? "sent" : "failed",
            providerMessageId: result.messageId,
            errorMessage: result.error,
          });
        }
      }
    } catch (dbError) {
      console.error("[EmailService] Failed to log email to database:", dbError);
    }

    return result;
  }

  // ── High-level template helpers ──────────────────────────────────────────────

  /** Send email verification link after registration */
  async sendVerificationEmail(to: { name: string; email: string }, token: string) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const verificationUrl = `${base}/verify-email?token=${token}`;
    const tpl = emailVerificationTemplate({
      userName: to.name,
      verificationUrl,
      expiresInHours: 24,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
  }

  /** Send password reset link */
  async sendPasswordResetEmail(to: { name: string; email: string }, token: string) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const resetUrl = `${base}/reset-password?token=${token}`;
    const tpl = passwordResetTemplate({
      userName: to.name,
      resetUrl,
      expiresInMinutes: 30,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
  }

  /** Send welcome email after successful registration / email verification */
  async sendWelcomeEmail(to: { name: string; email: string }) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const tpl = welcomeEmailTemplate({
      userName: to.name,
      dashboardUrl: `${base}/dashboard`,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
  }

  /** Send farm invitation email */
  async sendFarmInviteEmail(
    to: { name?: string; email: string },
    ctx: { inviterName: string; farmName: string; role: string; inviteToken: string },
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const inviteUrl = `${base}/accept-invite?token=${ctx.inviteToken}`;
    const tpl = farmInviteTemplate({
      inviterName: ctx.inviterName,
      farmName: ctx.farmName,
      role: ctx.role,
      inviteUrl,
      expiresInDays: 7,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
  }

  /** Send organization invitation email */
  async sendOrganizationInviteEmail(
    to: { name?: string; email: string },
    ctx: { inviterName: string; organizationName: string; role: string; inviteToken: string },
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const inviteUrl = `${base}/accept-org-invite?token=${ctx.inviteToken}`;
    const tpl = organizationInviteTemplate({
      inviterName: ctx.inviterName,
      organizationName: ctx.organizationName,
      role: ctx.role,
      inviteUrl,
      expiresInDays: 7,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "organization_invite" });
  }

  /** Send email when a trial subscription starts */
  async sendTrialStartedEmail(
    to: { name: string; email: string },
    ctx: { organizationName: string; planName: string; trialDays: number; expiresAt: string }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const billingUrl = `${base}/settings/organization/billing`;
    const tpl = trialStartedEmailTemplate({
      ...ctx,
      userName: to.name,
      billingUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "trial_started" });
  }

  // ── Admin templates ──────────────────────────────────────────────────────────

  /** Send platform announcement */
  async sendPlatformAnnouncement(
    to: { name: string; email: string },
    ctx: { subject: string; message: string; callToActionUrl?: string; callToActionLabel?: string },
    senderId?: number
  ) {
    const tpl = platformAnnouncementTemplate({
      userName: to.name,
      subject: ctx.subject,
      message: ctx.message,
      callToActionUrl: ctx.callToActionUrl,
      callToActionLabel: ctx.callToActionLabel,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "platform_announcement", senderId });
  }

  /** Send payment reminder */
  async sendPaymentReminder(
    to: { name: string; email: string },
    ctx: { planName: string; amount: string; expiryDate: string; paymentUrl: string },
    senderId?: number
  ) {
    const tpl = paymentReminderTemplate({
      userName: to.name,
      planName: ctx.planName,
      amount: ctx.amount,
      expiryDate: ctx.expiryDate,
      paymentUrl: ctx.paymentUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "payment_reminder", senderId });
  }

  /** Send security alert */
  async sendSecurityAlert(
    to: { name: string; email: string },
    ctx: { alertTitle: string; message: string },
    senderId?: number
  ) {
    const tpl = securityAlertTemplate({
      userName: to.name,
      alertTitle: ctx.alertTitle,
      message: ctx.message,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "security_alert", senderId });
  }

  // ── Automated Billing Helpers ──────────────────────────────────────────────

  /** Send trial ending reminder (7d, 3d, 1d) */
  async sendTrialEndingEmail(
    to: { name: string; email: string },
    ctx: { organizationName: string; planName: string; daysRemaining: number; expiresAt: string }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const billingUrl = `${base}/settings/organization/billing`;
    const tpl = trialEndingTemplate({
      ...ctx,
      userName: to.name,
      billingUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: `trial_ending_${ctx.daysRemaining}d` });
  }

  /** Send trial expired email */
  async sendTrialExpiredEmail(
    to: { name: string; email: string },
    ctx: { organizationName: string; planName: string }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const billingUrl = `${base}/settings/organization/billing`;
    const tpl = trialExpiredTemplate({
      ...ctx,
      userName: to.name,
      billingUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "trial_expired" });
  }

  /** Send subscription past due notice */
  async sendSubscriptionPastDueEmail(
    to: { name: string; email: string },
    ctx: { organizationName: string; planName: string; amount?: string; dueDate?: string }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const billingUrl = `${base}/settings/organization/billing`;
    const tpl = subscriptionPastDueTemplate({
      ...ctx,
      userName: to.name,
      billingUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "subscription_past_due" });
  }

  /** Send subscription suspended notice */
  async sendSubscriptionSuspendedEmail(
    to: { name: string; email: string },
    ctx: { organizationName: string; planName: string }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const reactivateUrl = `${base}/settings/organization/billing`;
    const tpl = subscriptionSuspendedTemplate({
      ...ctx,
      userName: to.name,
      reactivateUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "subscription_suspended" });
  }

  /** Send payment success receipt */
  async sendPaymentSuccessEmail(
    to: { name: string; email: string },
    ctx: { organizationName: string; planName: string; amount: string; currency: string; invoiceUrl?: string }
  ) {
    const tpl = paymentSuccessTemplate({
      ...ctx,
      userName: to.name,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "payment_success" });
  }

  /** Send payment failed alert */
  async sendPaymentFailedEmail(
    to: { name: string; email: string },
    ctx: { organizationName: string; planName: string; amount: string; currency: string; failureReason?: string }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const retryUrl = `${base}/settings/organization/billing`;
    const tpl = paymentFailedTemplate({
      ...ctx,
      userName: to.name,
      retryUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "payment_failed" });
  }

  /** Send plan changed confirmation */
  async sendPlanChangedEmail(
    to: { name: string; email: string },
    ctx: { organizationName: string; oldPlanName: string; newPlanName: string }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const billingUrl = `${base}/settings/organization/billing`;
    const tpl = planChangedTemplate({
      ...ctx,
      userName: to.name,
      billingUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "plan_changed" });
  }

  /** Send usage quota warning */
  async sendUsageLimitWarningEmail(
    to: { name: string; email: string },
    ctx: { organizationName: string; metricName: string; currentUsage: number; maxLimit: number; percentUsed: number }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const upgradeUrl = `${base}/settings/organization/billing`;
    const tpl = usageLimitWarningTemplate({
      ...ctx,
      userName: to.name,
      upgradeUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "usage_limit_warning" });
  }

  // ── Agricultural Intelligence & Digest Helpers ─────────────────────────────

  /** Send farm digest (weekly/monthly) */
  async sendFarmDigestEmail(
    to: { name: string; email: string },
    ctx: { farmName: string; periodLabel: string; highlights: Array<{ title: string; description: string; metric?: string }> }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const dashboardUrl = `${base}/dashboard`;
    const tpl = farmDigestTemplate({
      ...ctx,
      userName: to.name,
      dashboardUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "farm_digest" });
  }

  /** Send regional agronomy briefing */
  async sendRegionalAgriInsightEmail(
    to: { name: string; email: string },
    ctx: { regionName: string; weatherSummary?: string; cropInsights?: string; pestAlerts?: string; marketInsights?: string }
  ) {
    const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
    const portalUrl = `${base}/intelligence`;
    const tpl = regionalAgriInsightTemplate({
      ...ctx,
      userName: to.name,
      portalUrl,
    });
    return this.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text, templateKey: "regional_insight" });
  }

  // ── User Preference Check ──────────────────────────────────────────────────

  /** Check if a recipient has opted out of this email category */
  async isUserOptedIn(userId: number, category: "billing" | "agri" | "digest" | "security"): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return true;
      const [pref] = await db
        .select()
        .from(userEmailPreferences)
        .where(eq(userEmailPreferences.userId, userId))
        .limit(1);

      if (!pref) return true; // Default is opted-in
      if (category === "billing") return pref.billingEmails;
      if (category === "agri") return pref.agriInsightEmails;
      if (category === "digest") return pref.farmDigestEmails;
      if (category === "security") return pref.securityEmails;
      return true;
    } catch (e) {
      console.warn("[EmailService] Failed to check user email preference:", e);
      return true;
    }
  }
}



