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

/** Wraps any email body in the shared KilimoHub branded shell */
function shell(content: string, previewText = ""): string {
  const base = process.env.APP_BASE_URL ?? "https://kilimohub.onrender.com";
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>KilimoHub</title>
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
              <img src="${base}/logo.png" alt="KilimoHub" height="36" style="height:36px;object-fit:contain;" />
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
                <a href="${base}" style="color:${BRAND.primary};text-decoration:none;">KilimoHub</a>.
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.textMuted};">
                © ${new Date().getFullYear()} KilimoHub Technologies Ltd · Nairobi, Kenya
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
  const subject = "Verify your KilimoHub email address";
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Verify your email</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, welcome to KilimoHub! Please verify your email address to activate your account.
    </p>
    ${button("Verify Email Address", ctx.verificationUrl)}
    ${infoBox(`This link expires in <strong>${ctx.expiresInHours} hours</strong>. If you didn't create a KilimoHub account, you can safely ignore this email.`)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Or copy and paste this URL into your browser:<br/>
      <a href="${ctx.verificationUrl}" style="color:${BRAND.primary};word-break:break-all;">${ctx.verificationUrl}</a>
    </p>`,
    "Verify your email address to get started with KilimoHub",
  );
  const text = `Hi ${ctx.userName},\n\nVerify your KilimoHub email: ${ctx.verificationUrl}\n\nThis link expires in ${ctx.expiresInHours} hours.`;
  return { subject, html, text };
}

export function passwordResetTemplate(ctx: {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = "Reset your KilimoHub password";
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Reset your password</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, we received a request to reset your KilimoHub password. Click the button below to choose a new password.
    </p>
    ${button("Reset Password", ctx.resetUrl, BRAND.danger)}
    ${infoBox(`This link expires in <strong>${ctx.expiresInMinutes} minutes</strong>. If you didn't request a password reset, please ignore this email — your password will remain unchanged.`, BRAND.warning)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      Or copy and paste this URL:<br/>
      <a href="${ctx.resetUrl}" style="color:${BRAND.primary};word-break:break-all;">${ctx.resetUrl}</a>
    </p>`,
    "Reset your KilimoHub account password",
  );
  const text = `Hi ${ctx.userName},\n\nReset your password: ${ctx.resetUrl}\n\nExpires in ${ctx.expiresInMinutes} minutes.`;
  return { subject, html, text };
}

export function welcomeEmailTemplate(ctx: {
  userName: string;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "Welcome to KilimoHub 🌱";
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
      Your KilimoHub account is ready. You're joining thousands of smart farmers who are growing more efficiently with technology.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:${BRAND.background};border-radius:12px;padding:20px;">
      <tbody>${featureRows}</tbody>
    </table>
    ${button("Go to Your Dashboard", ctx.dashboardUrl)}
    ${infoBox("Need help getting started? Visit our <a href='https://kilimohub.onrender.com' style='color:${BRAND.primary};'>Help Center</a> or reply to this email and we'll assist you.")}`,
    `Welcome aboard, ${ctx.userName}! Your KilimoHub account is ready.`,
  );
  const text = `Welcome to KilimoHub, ${ctx.userName}!\n\nYour account is ready. Get started: ${ctx.dashboardUrl}`;
  return { subject, html, text };
}

export function farmInviteTemplate(ctx: {
  inviterName: string;
  farmName: string;
  role: string;
  inviteUrl: string;
  expiresInDays: number;
}): { subject: string; html: string; text: string } {
  const subject = `${ctx.inviterName} invited you to join ${ctx.farmName} on KilimoHub`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">You've been invited!</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      <strong>${ctx.inviterName}</strong> has invited you to join <strong>${ctx.farmName}</strong> on KilimoHub as a <strong>${ctx.role}</strong>.
    </p>
    ${button(`Accept Invitation to ${ctx.farmName}`, ctx.inviteUrl)}
    ${infoBox(`This invitation expires in <strong>${ctx.expiresInDays} days</strong>. You will need a KilimoHub account to accept.`)}
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
  const subject = `${ctx.inviterName} invited you to join ${ctx.organizationName} on KilimoHub`;
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
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">This is a system announcement from the KilimoHub team.</p>`,
    "Important update from KilimoHub"
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
  const subject = `Action Required: KilimoHub Subscription Expiring Soon`;
  const html = shell(
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textPrimary};">Subscription Expiring</h1>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${ctx.userName}, your KilimoHub <strong>${ctx.planName}</strong> subscription will expire on <strong>${ctx.expiryDate}</strong>.
    </p>
    <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textSecondary};line-height:1.6;">
      To avoid any interruption in service, please renew your subscription for <strong>${ctx.amount}</strong>.
    </p>
    ${button("Renew Subscription", ctx.paymentUrl)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">
      If you've already made a payment, please ignore this email.
    </p>`,
    "Your KilimoHub subscription is expiring soon"
  );
  const text = `Hi ${ctx.userName},\n\nYour KilimoHub ${ctx.planName} subscription expires on ${ctx.expiryDate}. Renew for ${ctx.amount}: ${ctx.paymentUrl}`;
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
    "Important security alert regarding your KilimoHub account"
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
      Hi ${ctx.userName}, your <strong>${ctx.trialDays}-day free trial</strong> of the KilimoHub ${ctx.planName} plan for <strong>${ctx.organizationName}</strong> has officially started!
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
    `Your ${ctx.trialDays}-day free trial of KilimoHub ${ctx.planName} has started.`
  );
  const text = `Hi ${ctx.userName},\n\nYour ${ctx.trialDays}-day free trial of the KilimoHub ${ctx.planName} plan for ${ctx.organizationName} has started.\n\nManage your subscription here: ${ctx.billingUrl}`;
  return { subject, html, text };
}
