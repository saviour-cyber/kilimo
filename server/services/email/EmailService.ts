// ─── EmailService ─────────────────────────────────────────────────────────────
// Provider-agnostic email service for KilimoHub.
// Switching providers requires only an environment variable change.
//
// Configuration (environment variables):
//   EMAIL_PROVIDER      = resend | brevo | console   (default: console)
//   RESEND_API_KEY      = re_xxxxxxxxxxxx             (required for resend)
//   BREVO_API_KEY       = xkeysib-xxxxxxxxxxxx        (required for brevo)
//   EMAIL_FROM_ADDRESS  = noreply@kilimohub.co.ke     (default sender address)
//   EMAIL_FROM_NAME     = KilimoHub                   (default sender name)
//   APP_BASE_URL        = https://kilimohub.onrender.com

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
} from "./templates";
import { getDb } from "../../db";
import { platformEmailLogs } from "../../../drizzle/schema";

export class EmailService {
  private provider: IEmailProvider;

  constructor(provider: IEmailProvider) {
    this.provider = provider;
    console.log(`[EmailService] Initialized with provider: ${provider.name}`);
  }

  // ── Low-level send ───────────────────────────────────────────────────────────

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const defaultFrom = {
      name: process.env.EMAIL_FROM_NAME ?? "KilimoHub",
      email: process.env.EMAIL_FROM_ADDRESS ?? "noreply@kilimohub.co.ke",
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
    const base = process.env.APP_BASE_URL ?? "https://kilimohub.onrender.com";
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
    const base = process.env.APP_BASE_URL ?? "https://kilimohub.onrender.com";
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
    const base = process.env.APP_BASE_URL ?? "https://kilimohub.onrender.com";
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
    const base = process.env.APP_BASE_URL ?? "https://kilimohub.onrender.com";
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
    const base = process.env.APP_BASE_URL ?? "https://kilimohub.onrender.com";
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
    const base = process.env.APP_BASE_URL ?? "https://kilimohub.onrender.com";
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
}
