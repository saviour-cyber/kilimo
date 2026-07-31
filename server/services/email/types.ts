// ─── Email Engine — Shared Types ─────────────────────────────────────────────
// All email providers and the EmailService communicate through these interfaces.
// This keeps business logic completely decoupled from any specific provider SDK.

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface SendEmailOptions {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string; // Plain-text fallback
  from?: EmailAddress; // Overrides the default sender
  replyTo?: EmailAddress;
  tags?: Record<string, string>; // Metadata for analytics
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Provider Interface ───────────────────────────────────────────────────────
// Any provider (Resend, Brevo, AWS SES, SendGrid) must implement this interface.

export interface IEmailProvider {
  readonly name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}

// ─── Template Context Types ───────────────────────────────────────────────────

export interface EmailVerificationContext {
  userName: string;
  verificationUrl: string;
  expiresInHours: number;
}

export interface PasswordResetContext {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface WelcomeEmailContext {
  userName: string;
  dashboardUrl: string;
}

export interface FarmInviteContext {
  inviterName: string;
  farmName: string;
  role: string;
  inviteUrl: string;
  expiresInDays: number;
}

export interface OrganizationInviteContext {
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
  expiresInDays: number;
}
