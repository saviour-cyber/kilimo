export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // ── Email Engine ─────────────────────────────────────────────────────────────
  // Set EMAIL_PROVIDER to switch providers without touching business logic.
  // Supported: "resend" | "brevo" | "console" (default)
  emailProvider:    process.env.EMAIL_PROVIDER    ?? "console",
  resendApiKey:     process.env.RESEND_API_KEY    ?? "",
  brevoApiKey:      process.env.BREVO_API_KEY     ?? "",
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS ?? "noreply@kilimohub.co.ke",
  emailFromName:    process.env.EMAIL_FROM_NAME    ?? "KilimoHub",
  appBaseUrl:       process.env.APP_BASE_URL       ?? "https://kilimohub.onrender.com",
};
