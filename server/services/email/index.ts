// ─── Email Engine — Singleton Factory ────────────────────────────────────────
// Import `emailService` anywhere in the server to send emails.
// Switching providers: change EMAIL_PROVIDER env var. No code changes needed.
//
// Supported values for EMAIL_PROVIDER:
//   resend   → requires RESEND_API_KEY
//   brevo    → requires BREVO_API_KEY
//   console  → logs to stdout (default when no key is set)

import { EmailService } from "./EmailService";
import { ResendProvider } from "./providers/resend";
import { BrevoProvider } from "./providers/brevo";
import { ConsoleProvider } from "./providers/console";
import type { IEmailProvider } from "./types";

function createProvider(): IEmailProvider {
  const providerName = (process.env.EMAIL_PROVIDER ?? "console").toLowerCase();

  switch (providerName) {
    case "resend": {
      const key = process.env.RESEND_API_KEY ?? "";
      if (!key) {
        console.warn("[EmailEngine] EMAIL_PROVIDER=resend but RESEND_API_KEY is missing. Falling back to console.");
        return new ConsoleProvider();
      }
      return new ResendProvider(key);
    }
    case "brevo": {
      const key = process.env.BREVO_API_KEY ?? "";
      if (!key) {
        console.warn("[EmailEngine] EMAIL_PROVIDER=brevo but BREVO_API_KEY is missing. Falling back to console.");
        return new ConsoleProvider();
      }
      return new BrevoProvider(key);
    }
    case "console":
    default:
      return new ConsoleProvider();
  }
}

// Lazily initialized singleton — created once on first import
let _emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!_emailService) {
    _emailService = new EmailService(createProvider());
  }
  return _emailService;
}

// Convenience re-export for one-liner imports
export const emailService = getEmailService();

// Re-export types for consumers
export type { SendEmailOptions, SendEmailResult, IEmailProvider } from "./types";
export { EmailService } from "./EmailService";
