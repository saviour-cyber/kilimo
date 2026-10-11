// ─── Reusable HTML Email Templates ───────────────────────────────────────────
// All templates use plain HTML with inline CSS for maximum email client support.
// No external CSS frameworks — email clients strip them.

const BRAND = {
  primary: "#10B981",
  primaryDark: "#059669",
  sidebar: "#0F172A",
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
};

/** Wraps any email body in the shared KiliSense branded shell */
function shell(content: string, previewText = ""): string {
  const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>KiliSense</title>
  <!--[if !mso]><!-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.background};min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.sidebar};border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
              <img src="${base}/logo.png" alt="KiliSense" height="36" style="height:36px;object-fit:contain;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:${BRAND.card};border:1px solid ${BRAND.border};border-top:none;border-radius:0 0 16px 16px;padding:40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:${BRAND.textMuted};">
                You're receiving this email because you have an account at
                <a href="${base}" style="color:${BRAND.primary};text-decoration:none;">KiliSense</a>.
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.textMuted};">
                © ${new Date().getFullYear()} KiliSense Technologies Ltd · Nyeri, Kenya
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Reusable CTA button */
function button(label: string, url: string, color = BRAND.primary): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:100px;background-color:${color};">
        <a href="${url}" target="_blank"
           style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;letter-spacing:0.01em;">
          ${label} →
        </a>
      </td>
    </tr>
  </table>`;
}

/** Info box (tip, warning, etc.) */
function infoBox(text: string, color = BRAND.primary): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:${color}18;border-left:4px solid ${color};border-radius:0 8px 8px 0;padding:14px 18px;">
        <p style="margin:0;font-size:14px;color:${BRAND.textPrimary};line-height:1.6;">${text}</p>
      </td>
    </tr>
  </table>`;
}

/** Divider */
const divider = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr><td style="border-top:1px solid ${BRAND.border};"></td></tr>
</table>`;

// ─── Template Exports ─────────────────────────────────────────────────────────

export function emailVerificationTemplate(ctx: {
  userName: string;
  verificationUrl: string;
  expiresInHours: number;
}): { subject: string; html: string; text: string } {
  const subject = "Verify your KiliSense email address";
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Verify your email</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, welcome to KiliSense! Please verify your email address to activate your account.
    </p>
    ${button("Verify Email Address", ctx.verificationUrl)}
    ${infoBox(`This link expires in <strong>${ctx.expiresInHours} hours</strong>. If you didn't create a KiliSense account, you can safely ignore this email.`)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Or copy and paste this URL into your browser:<br/>
      <a href="${ctx.verificationUrl}" style="color:${BRAND.primary};word-break:break-all;">${ctx.verificationUrl}</a>
    </p>`,
    "Verify your email address to get started with KiliSense",
  );
  const text = `Hi ${ctx.userName},\n\nVerify your KiliSense email: ${ctx.verificationUrl}\n\nThis link expires in ${ctx.expiresInHours} hours.`;
  return { subject, html, text };
}

export function passwordResetTemplate(ctx: {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = "Reset your KiliSense password";
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Reset your password</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, we received a request to reset your KiliSense password. Click the button below to choose a new password.
    </p>
    ${button("Reset Password", ctx.resetUrl, BRAND.danger)}
    ${infoBox(`This link expires in <strong>${ctx.expiresInMinutes} minutes</strong>. If you didn't request a password reset, please ignore this email — your password will remain unchanged.`, BRAND.warning)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Or copy and paste this URL:<br/>
      <a href="${ctx.resetUrl}" style="color:${BRAND.primary};word-break:break-all;">${ctx.resetUrl}</a>
    </p>`,
    "Reset your KiliSense account password",
  );
  const text = `Hi ${ctx.userName},\n\nReset your password: ${ctx.resetUrl}\n\nExpires in ${ctx.expiresInMinutes} minutes.`;
  return { subject, html, text };
}

export function welcomeEmailTemplate(ctx: {
  userName: string;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "Welcome to KiliSense 🌱";
  const features = [
    ["🌾", "Farm Management", "Track fields, plantings, and harvests"],
    ["🤖", "Kili AI", "Smart crop recommendations and pest guidance"],
    ["📊", "Finance Tracking", "Monitor income, expenses and P&L"],
    ["🔬", "Disease Detection", "AI-powered diagnosis from photos"],
  ];
  const featureRows = features
    .map(
      ([icon, name, desc]) =>
        `<tr>
          <td style="padding:10px 0;vertical-align:top;width:36px;font-size:20px;">${icon}</td>
          <td style="padding:10px 0;padding-left:12px;">
            <strong style="display:block;font-size:14px;color:${BRAND.textPrimary};">${name}</strong>
            <span style="font-size:13px;color:${BRAND.textSecondary};">${desc}</span>
          </td>
        </tr>`,
    )
    .join("");

  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Welcome, ${ctx.userName}! 🎉</h1>
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Your KiliSense account is ready. You're joining thousands of smart farmers who are growing more efficiently with technology.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:${BRAND.background};border-radius:12px;padding:20px;">
      <tbody>${featureRows}</tbody>
    </table>
    ${button("Go to Your Dashboard", ctx.dashboardUrl)}
    ${infoBox("Need help getting started? Visit our <a href='https://kilisense.onrender.com' style='color:${BRAND.primary};'>Help Center</a> or reply to this email and we'll assist you.")}`,
    `Welcome aboard, ${ctx.userName}! Your KiliSense account is ready.`,
  );
  const text = `Welcome to KiliSense, ${ctx.userName}!\n\nYour account is ready. Get started: ${ctx.dashboardUrl}`;
  return { subject, html, text };
}

export function farmInviteTemplate(ctx: {
  inviterName: string;
  farmName: string;
  role: string;
  inviteUrl: string;
  expiresInDays: number;
}): { subject: string; html: string; text: string } {
  const subject = `${ctx.inviterName} invited you to join ${ctx.farmName} on KiliSense`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">You've been invited!</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      <strong>${ctx.inviterName}</strong> has invited you to join <strong>${ctx.farmName}</strong> on KiliSense as a <strong>${ctx.role}</strong>.
    </p>
    ${button(`Accept Invitation to ${ctx.farmName}`, ctx.inviteUrl)}
    ${infoBox(`This invitation expires in <strong>${ctx.expiresInDays} days</strong>. You will need a KiliSense account to accept.`)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Or copy and paste: <a href="${ctx.inviteUrl}" style="color:${BRAND.primary};word-break:break-all;">${ctx.inviteUrl}</a>
    </p>`,
    `${ctx.inviterName} invited you to join ${ctx.farmName}`,
  );
  const text = `${ctx.inviterName} invited you to join ${ctx.farmName} as ${ctx.role}.\n\nAccept: ${ctx.inviteUrl}\n\nExpires in ${ctx.expiresInDays} days.`;
  return { subject, html, text };
}

export function organizationInviteTemplate(ctx: {
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
  expiresInDays: number;
}): { subject: string; html: string; text: string } {
  const subject = `${ctx.inviterName} invited you to join ${ctx.organizationName} on KiliSense`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Organization Invitation</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      <strong>${ctx.inviterName}</strong> has invited you to join <strong>${ctx.organizationName}</strong> as a <strong>${ctx.role}</strong>.
    </p>
    ${button(`Accept Invitation`, ctx.inviteUrl)}
    ${infoBox(`This invitation expires in <strong>${ctx.expiresInDays} days</strong>.`)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Or copy and paste: <a href="${ctx.inviteUrl}" style="color:${BRAND.primary};word-break:break-all;">${ctx.inviteUrl}</a>
    </p>`,
    `${ctx.inviterName} invited you to join ${ctx.organizationName}`,
  );
  const text = `${ctx.inviterName} invited you to join ${ctx.organizationName} as ${ctx.role}.\n\nAccept: ${ctx.inviteUrl}\n\nExpires in ${ctx.expiresInDays} days.`;
  return { subject, html, text };
}

export function platformAnnouncementTemplate(ctx: {
  userName: string;
  subject: string;
  message: string;
  callToActionUrl?: string;
  callToActionLabel?: string;
}): { subject: string; html: string; text: string } {
  const subject = ctx.subject;
  const html = shell(
    `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.textPrimary};">${ctx.subject}</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;white-space:pre-wrap;">Hello ${ctx.userName},\n\n${ctx.message}</p>
    ${ctx.callToActionUrl && ctx.callToActionLabel ? button(ctx.callToActionLabel, ctx.callToActionUrl) : ""}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">This is a system announcement from the KiliSense team.</p>`,
    "Important update from KiliSense"
  );
  const text = `Hello ${ctx.userName},\n\n${ctx.message}\n\n${ctx.callToActionUrl ? `${ctx.callToActionLabel}: ${ctx.callToActionUrl}` : ""}`;
  return { subject, html, text };
}

export function paymentReminderTemplate(ctx: {
  userName: string;
  planName: string;
  amount: string;
  expiryDate: string;
  paymentUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Action Required: KiliSense Subscription Expiring Soon`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Subscription Expiring</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, your KiliSense <strong>${ctx.planName}</strong> subscription will expire on <strong>${ctx.expiryDate}</strong>.
    </p>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      To avoid any interruption in service, please renew your subscription for <strong>${ctx.amount}</strong>.
    </p>
    ${button("Renew Subscription", ctx.paymentUrl)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      If you've already made a payment, please ignore this email.
    </p>`,
    "Your KiliSense subscription is expiring soon"
  );
  const text = `Hi ${ctx.userName},\n\nYour KiliSense ${ctx.planName} subscription expires on ${ctx.expiryDate}. Renew for ${ctx.amount}: ${ctx.paymentUrl}`;
  return { subject, html, text };
}

export function securityAlertTemplate(ctx: {
  userName: string;
  alertTitle: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const subject = `Security Alert: ${ctx.alertTitle}`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Security Alert</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName},
    </p>
    ${infoBox(ctx.message, BRAND.danger)}
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      If you did not authorize this action or suspect unauthorized access to your account, please contact our support team immediately.
    </p>`,
    "Important security alert regarding your KiliSense account"
  );
  const text = `Hi ${ctx.userName},\n\nSecurity Alert: ${ctx.alertTitle}\n\n${ctx.message}\n\nIf you did not authorize this, contact support immediately.`;
  return { subject, html, text };
}

export function trialStartedEmailTemplate(ctx: {
  userName: string;
  organizationName: string;
  planName: string;
  trialDays: number;
  expiresAt: string;
  billingUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Your ${ctx.planName} trial has started! 🎉`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Welcome to ${ctx.planName}</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, your <strong>${ctx.trialDays}-day free trial</strong> of the KiliSense ${ctx.planName} plan for <strong>${ctx.organizationName}</strong> has officially started!
    </p>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      You now have access to all the features included in the plan until <strong>${ctx.expiresAt}</strong>. 
      You can manage your subscription and billing details at any time from your organization settings.
    </p>
    ${button("Manage Subscription", ctx.billingUrl)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Need help? Reply to this email and our support team will assist you.
    </p>`,
    `Your ${ctx.trialDays}-day free trial of KiliSense ${ctx.planName} has started.`
  );
  const text = `Hi ${ctx.userName},\n\nYour ${ctx.trialDays}-day free trial of the KiliSense ${ctx.planName} plan for ${ctx.organizationName} has started.\n\nManage your subscription here: ${ctx.billingUrl}`;
  return { subject, html, text };
}

export function trialEndingTemplate(ctx: {
  userName: string;
  organizationName: string;
  planName: string;
  daysRemaining: number;
  expiresAt: string;
  billingUrl: string;
}): { subject: string; html: string; text: string } {
  const urgencyWord = ctx.daysRemaining === 1 ? "tomorrow" : `in ${ctx.daysRemaining} days`;
  const subject = `Reminder: Your ${ctx.planName} trial ends ${urgencyWord}`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Trial ending soon</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, your free trial of the <strong>${ctx.planName}</strong> plan for <strong>${ctx.organizationName}</strong> will expire ${urgencyWord} on <strong>${ctx.expiresAt}</strong>.
    </p>
    ${infoBox(`To ensure uninterrupted access to your farm records, AI crop insights, and IoT monitoring, please choose a subscription plan before your trial ends.`, BRAND.warning)}
    ${button("Upgrade & Keep Access", ctx.billingUrl)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Need assistance or custom billing options? Reply directly to this email.
    </p>`,
    `Your KiliSense trial expires ${urgencyWord}. Keep your farm data running.`
  );
  const text = `Hi ${ctx.userName},\n\nYour trial for ${ctx.organizationName} (${ctx.planName}) ends ${urgencyWord} on ${ctx.expiresAt}.\n\nUpgrade here: ${ctx.billingUrl}`;
  return { subject, html, text };
}

export function trialExpiredTemplate(ctx: {
  userName: string;
  organizationName: string;
  planName: string;
  billingUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Your KiliSense trial has expired`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Your trial has ended</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, the trial period for <strong>${ctx.organizationName}</strong> (${ctx.planName}) has ended.
    </p>
    ${infoBox(`Your farm data and historical records are safely preserved, but premium features such as real-time IoT alerts and automated disease scans are paused until you activate a subscription.`, BRAND.warning)}
    ${button("Reactivate Subscription", ctx.billingUrl)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      You can select from affordable monthly or annual plans anytime to restore full functionality.
    </p>`,
    `Your trial has ended. Reactivate now to restore full access.`
  );
  const text = `Hi ${ctx.userName},\n\nThe trial for ${ctx.organizationName} has ended. Your records are safe. Reactivate anytime: ${ctx.billingUrl}`;
  return { subject, html, text };
}

export function subscriptionPastDueTemplate(ctx: {
  userName: string;
  organizationName: string;
  planName: string;
  amount?: string;
  dueDate?: string;
  billingUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Payment Due: KiliSense Subscription`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.danger};">Payment Needed</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, we were unable to process the renewal payment for <strong>${ctx.organizationName}</strong> (${ctx.planName}).
    </p>
    ${infoBox(`Your account has a <strong>7-day grace period</strong> before access is suspended. Please update your payment method or complete the payment to maintain active service.`, BRAND.danger)}
    ${button("Complete Payment", ctx.billingUrl, BRAND.danger)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      If you already submitted this payment via M-Pesa or wire transfer, please reply with your transaction reference.
    </p>`,
    `Action required: Payment due for ${ctx.organizationName}.`
  );
  const text = `Hi ${ctx.userName},\n\nPayment for ${ctx.organizationName} (${ctx.planName}) is past due. Update your payment within 7 days: ${ctx.billingUrl}`;
  return { subject, html, text };
}

export function subscriptionSuspendedTemplate(ctx: {
  userName: string;
  organizationName: string;
  planName: string;
  reactivateUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Important: Your KiliSense subscription is suspended`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.danger};">Subscription Suspended</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, the subscription for <strong>${ctx.organizationName}</strong> (${ctx.planName}) has been suspended due to overdue payment.
    </p>
    ${infoBox(`Your team members cannot access farm workflows or IoT device telemetry while suspended. You can immediately restore access by completing payment.`, BRAND.danger)}
    ${button("Restore Access Now", ctx.reactivateUrl, BRAND.primary)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Need billing support? Contact billing@kilisense.co.ke.
    </p>`,
    `Your subscription is suspended. Reconnect now.`
  );
  const text = `Hi ${ctx.userName},\n\nSubscription for ${ctx.organizationName} is suspended due to overdue payment. Restore: ${ctx.reactivateUrl}`;
  return { subject, html, text };
}

export function paymentSuccessTemplate(ctx: {
  userName: string;
  organizationName: string;
  planName: string;
  amount: string;
  currency: string;
  invoiceUrl?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Payment Confirmed: ${ctx.planName} Subscription`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Thank you for your payment! ✅</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, we have received your payment of <strong>${ctx.currency} ${ctx.amount}</strong> for <strong>${ctx.organizationName}</strong>.
    </p>
    ${infoBox(`Your <strong>${ctx.planName}</strong> plan is fully active. All farm sensors, automated telemetry, and AI modules are enabled.`, BRAND.success)}
    ${ctx.invoiceUrl ? button("View Receipt / Invoice", ctx.invoiceUrl) : ""}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Thank you for empowering modern agriculture with KiliSense.
    </p>`,
    `Payment receipt: ${ctx.currency} ${ctx.amount} received for ${ctx.organizationName}.`
  );
  const text = `Hi ${ctx.userName},\n\nPayment of ${ctx.currency} ${ctx.amount} for ${ctx.organizationName} (${ctx.planName}) received successfully.`;
  return { subject, html, text };
}

export function paymentFailedTemplate(ctx: {
  userName: string;
  organizationName: string;
  planName: string;
  amount: string;
  currency: string;
  retryUrl: string;
  failureReason?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Payment Unsuccessful: KiliSense ${ctx.planName}`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.danger};">Payment Attempt Failed</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, the payment of <strong>${ctx.currency} ${ctx.amount}</strong> for <strong>${ctx.organizationName}</strong> could not be processed.
    </p>
    ${ctx.failureReason ? infoBox(`Reason: <em>${ctx.failureReason}</em>`, BRAND.warning) : ""}
    ${button("Retry Payment", ctx.retryUrl, BRAND.danger)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Please check your card or M-Pesa balance and attempt payment again.
    </p>`,
    `Payment unsuccessful for ${ctx.organizationName}. Please retry.`
  );
  const text = `Hi ${ctx.userName},\n\nPayment attempt failed for ${ctx.organizationName}. Retry here: ${ctx.retryUrl}`;
  return { subject, html, text };
}

export function planChangedTemplate(ctx: {
  userName: string;
  organizationName: string;
  oldPlanName: string;
  newPlanName: string;
  billingUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Your KiliSense Plan has been updated to ${ctx.newPlanName}`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Plan Updated</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, the subscription plan for <strong>${ctx.organizationName}</strong> was successfully switched from <strong>${ctx.oldPlanName}</strong> to <strong>${ctx.newPlanName}</strong>.
    </p>
    ${infoBox(`Your new entitlements and usage caps are active immediately across all farms and team members.`)}
    ${button("Review Subscription Details", ctx.billingUrl)}`,
    `Plan updated to ${ctx.newPlanName} for ${ctx.organizationName}.`
  );
  const text = `Hi ${ctx.userName},\n\nYour plan for ${ctx.organizationName} was updated to ${ctx.newPlanName}.\n\nReview: ${ctx.billingUrl}`;
  return { subject, html, text };
}

export function usageLimitWarningTemplate(ctx: {
  userName: string;
  organizationName: string;
  metricName: string;
  currentUsage: number;
  maxLimit: number;
  percentUsed: number;
  upgradeUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Usage Alert: You have used ${ctx.percentUsed}% of your ${ctx.metricName} limit`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Approaching Usage Limit</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, <strong>${ctx.organizationName}</strong> has reached <strong>${ctx.currentUsage} / ${ctx.maxLimit}</strong> (${ctx.percentUsed}%) of its monthly allowance for <strong>${ctx.metricName}</strong>.
    </p>
    ${infoBox(`To avoid disruptions when adding more devices, scanning crops, or exporting reports, consider upgrading your plan.`, BRAND.warning)}
    ${button("Upgrade Plan Allowance", ctx.upgradeUrl)}`,
    `You have used ${ctx.percentUsed}% of your ${ctx.metricName} quota.`
  );
  const text = `Hi ${ctx.userName},\n\n${ctx.organizationName} reached ${ctx.percentUsed}% of ${ctx.metricName} limit (${ctx.currentUsage}/${ctx.maxLimit}). Upgrade: ${ctx.upgradeUrl}`;
  return { subject, html, text };
}

export function farmDigestTemplate(ctx: {
  userName: string;
  farmName: string;
  periodLabel: string;
  highlights: Array<{ title: string; description: string; metric?: string }>;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `${ctx.farmName} — ${ctx.periodLabel}`;
  const rows = ctx.highlights
    .map(
      (h) => `<tr>
        <td style="padding:12px;border-bottom:1px solid ${BRAND.border};">
          <strong style="color:${BRAND.textPrimary};display:block;font-size:14px;">${h.title}</strong>
          <span style="color:${BRAND.textSecondary};font-size:13px;">${h.description}</span>
        </td>
        ${h.metric ? `<td style="padding:12px;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:700;color:${BRAND.primaryDark};">${h.metric}</td>` : ""}
      </tr>`
    )
    .join("");

  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.textPrimary};">${ctx.farmName} Digest</h1>
    <p style="margin:0 0 16px;font-size:14px;color:${BRAND.textSecondary};">${ctx.periodLabel}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:8px;">
      <tbody>${rows}</tbody>
    </table>
    ${button("Open Farm Dashboard", ctx.dashboardUrl)}`,
    `Your agricultural summary for ${ctx.farmName}.`
  );
  const text = `Hi ${ctx.userName},\n\nFarm Summary for ${ctx.farmName} (${ctx.periodLabel}):\n\n` +
    ctx.highlights.map(h => `- ${h.title}: ${h.description} ${h.metric ? `(${h.metric})` : ''}`).join('\n') +
    `\n\nDashboard: ${ctx.dashboardUrl}`;
  return { subject, html, text };
}

export function regionalAgriInsightTemplate(ctx: {
  userName: string;
  regionName: string;
  weatherSummary?: string;
  cropInsights?: string;
  pestAlerts?: string;
  marketInsights?: string;
  portalUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Agricultural Insights for ${ctx.regionName}`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.textPrimary};">Regional Agronomy Briefing</h1>
    <p style="margin:0 0 16px;font-size:14px;color:${BRAND.textSecondary};">Aggregated, anonymous regional patterns for <strong>${ctx.regionName}</strong></p>
    ${ctx.weatherSummary ? infoBox(`<strong>🌦️ Weather Outlook:</strong> ${ctx.weatherSummary}`, BRAND.primary) : ""}
    ${ctx.pestAlerts ? infoBox(`<strong>⚠️ Pest & Pathogen Warning:</strong> ${ctx.pestAlerts}`, BRAND.danger) : ""}
    ${ctx.cropInsights ? `<p style="font-size:14px;color:${BRAND.textSecondary};line-height:1.6;margin:16px 0;"><strong>🌱 Crop Advisory:</strong> ${ctx.cropInsights}</p>` : ""}
    ${ctx.marketInsights ? `<p style="font-size:14px;color:${BRAND.textSecondary};line-height:1.6;margin:16px 0;"><strong>📊 Market Trend:</strong> ${ctx.marketInsights}</p>` : ""}
    ${button("Explore Intelligence Center", ctx.portalUrl)}
    ${divider}
    <p style="margin:0;font-size:12px;color:${BRAND.textMuted};">
      Insights are generated from regional agronomic models. No farmer private information or individual scan history is ever disclosed.
    </p>`,
    `Regional insights for ${ctx.regionName}`
  );
  const text = `Regional Agronomy Briefing for ${ctx.regionName}\n\nWeather: ${ctx.weatherSummary || 'N/A'}\nPests: ${ctx.pestAlerts || 'N/A'}\nInsights: ${ctx.cropInsights || 'N/A'}\n\nView more: ${ctx.portalUrl}`;
  return { subject, html, text };
}

export function getTemplatePreview(templateKey: string): { subject: string; html: string } {
  const base = process.env.APP_BASE_URL ?? "https://kilisense.onrender.com";
  switch (templateKey) {
    case "trial_started":
      return trialStartedEmailTemplate({
        userName: "John Kiprono",
        organizationName: "Highland Greens Farm",
        planName: "Pro Agriculture",
        trialDays: 14,
        expiresAt: new Date(Date.now() + 14 * 86400000).toLocaleDateString(),
        billingUrl: `${base}/settings/organization/billing`,
      });
    case "trial_ending_7d":
    case "trial_ending_3d":
    case "trial_ending_1d": {
      const days = templateKey === "trial_ending_7d" ? 7 : templateKey === "trial_ending_3d" ? 3 : 1;
      return trialEndingTemplate({
        userName: "John Kiprono",
        organizationName: "Highland Greens Farm",
        planName: "Pro Agriculture",
        daysRemaining: days,
        expiresAt: new Date(Date.now() + days * 86400000).toLocaleDateString(),
        billingUrl: `${base}/settings/organization/billing`,
      });
    }
    case "trial_expired":
      return trialExpiredTemplate({
        userName: "John Kiprono",
        organizationName: "Highland Greens Farm",
        planName: "Pro Agriculture",
        billingUrl: `${base}/settings/organization/billing`,
      });
    case "subscription_past_due":
      return subscriptionPastDueTemplate({
        userName: "John Kiprono",
        organizationName: "Highland Greens Farm",
        planName: "Commercial Enterprise",
        amount: "KES 12,000",
        dueDate: new Date().toLocaleDateString(),
        billingUrl: `${base}/settings/organization/billing`,
      });
    case "subscription_suspended":
      return subscriptionSuspendedTemplate({
        userName: "John Kiprono",
        organizationName: "Highland Greens Farm",
        planName: "Commercial Enterprise",
        reactivateUrl: `${base}/settings/organization/billing`,
      });
    case "payment_success":
      return paymentSuccessTemplate({
        userName: "John Kiprono",
        organizationName: "Highland Greens Farm",
        planName: "Commercial Enterprise",
        amount: "12,000.00",
        currency: "KES",
        invoiceUrl: `${base}/invoices/sample`,
      });
    case "payment_failed":
      return paymentFailedTemplate({
        userName: "John Kiprono",
        organizationName: "Highland Greens Farm",
        planName: "Commercial Enterprise",
        amount: "12,000.00",
        currency: "KES",
        failureReason: "Insufficient M-Pesa balance",
        retryUrl: `${base}/settings/organization/billing`,
      });
    case "plan_changed":
      return planChangedTemplate({
        userName: "John Kiprono",
        organizationName: "Highland Greens Farm",
        oldPlanName: "Starter Farm",
        newPlanName: "Commercial Enterprise",
        billingUrl: `${base}/settings/organization/billing`,
      });
    case "usage_limit_warning":
      return usageLimitWarningTemplate({
        userName: "John Kiprono",
        organizationName: "Highland Greens Farm",
        metricName: "Connected IoT Devices",
        currentUsage: 9,
        maxLimit: 10,
        percentUsed: 90,
        upgradeUrl: `${base}/settings/organization/billing`,
      });
    case "farm_digest":
      return farmDigestTemplate({
        userName: "John Kiprono",
        farmName: "Highland Greens",
        periodLabel: "Weekly Farm Digest",
        highlights: [
          { title: "Soil Moisture Levels", description: "Average moisture maintained at optimal 42%", metric: "42%" },
          { title: "Milk Production", description: "Produced 1,280 liters across all milking cows", metric: "1,280 L" },
          { title: "Crop Stage", description: "Maize Section 2 moved into grain filling stage" },
        ],
        dashboardUrl: `${base}/dashboard`,
      });
    case "regional_insight":
      return regionalAgriInsightTemplate({
        userName: "John Kiprono",
        regionName: "Mount Kenya Central",
        weatherSummary: "Expected light rain (15-20mm) over Wednesday through Friday, temperatures 16°C - 24°C.",
        cropInsights: "Favorable conditions for foliar nutrient spraying before Thursday rains.",
        pestAlerts: "Increased Fall Armyworm activity detected across neighboring maize corridors.",
        marketInsights: "Local dry maize wholesale price up 6% this week to KES 3,800 per 90kg bag.",
        portalUrl: `${base}/intelligence`,
      });
    case "platform_announcement":
      return platformAnnouncementTemplate({
        userName: "John Kiprono",
        subject: "Scheduled Platform Maintenance Notice",
        message: "We will be performing scheduled performance optimizations this Sunday between 02:00 and 04:00 UTC.",
        callToActionLabel: "View Status",
        callToActionUrl: `${base}/status`,
      });
    case "security_alert":
      return securityAlertTemplate({
        userName: "John Kiprono",
        alertTitle: "New Sign-in Detected",
        message: "A new session was initiated on your account from Chrome on Windows (Nairobi, Kenya).",
      });
    default:
      return {
        subject: "KiliSense Notification",
        html: `<p>This is a preview of the ${templateKey} template.</p>`,
      };
  }
}



