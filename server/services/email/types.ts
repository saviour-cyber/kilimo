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
  templateKey?: string;
  senderId?: number;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;  // optionally identify which provider sent the email
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

export interface TrialEndingContext {
  userName: string;
  organizationName: string;
  planName: string;
  daysRemaining: number;
  expiresAt: string;
  billingUrl: string;
}

export interface TrialExpiredContext {
  userName: string;
  organizationName: string;
  planName: string;
  billingUrl: string;
}

export interface SubscriptionPastDueContext {
  userName: string;
  organizationName: string;
  planName: string;
  amount?: string;
  dueDate?: string;
  billingUrl: string;
}

export interface SubscriptionSuspendedContext {
  userName: string;
  organizationName: string;
  planName: string;
  reactivateUrl: string;
}

export interface PaymentSuccessContext {
  userName: string;
  organizationName: string;
  planName: string;
  amount: string;
  currency: string;
  invoiceUrl?: string;
}

export interface PaymentFailedContext {
  userName: string;
  organizationName: string;
  planName: string;
  amount: string;
  currency: string;
  retryUrl: string;
  failureReason?: string;
}

export interface PlanChangedContext {
  userName: string;
  organizationName: string;
  oldPlanName: string;
  newPlanName: string;
  billingUrl: string;
}

export interface UsageLimitWarningContext {
  userName: string;
  organizationName: string;
  metricName: string;
  currentUsage: number;
  maxLimit: number;
  percentUsed: number;
  upgradeUrl: string;
}

export interface FarmDigestItem {
  title: string;
  description: string;
  metric?: string;
}

export interface FarmDigestContext {
  userName: string;
  farmName: string;
  periodLabel: string; // e.g. "Weekly Digest: Oct 5 - Oct 12"
  highlights: FarmDigestItem[];
  dashboardUrl: string;
}

export interface RegionalAgriInsightContext {
  userName: string;
  regionName: string;
  weatherSummary?: string;
  cropInsights?: string;
  pestAlerts?: string;
  marketInsights?: string;
  portalUrl: string;
}

