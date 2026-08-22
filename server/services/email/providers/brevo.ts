// ─── Brevo Provider (formerly Sendinblue) ────────────────────────────────────
// Requires env var: BREVO_API_KEY
// Uses Brevo's transactional email REST API v3 (no SDK dependency needed).
// Docs: https://developers.brevo.com/reference/sendtransacemail

import type { IEmailProvider, SendEmailOptions, SendEmailResult } from "../types";

export class BrevoProvider implements IEmailProvider {
  readonly name = "brevo";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("[BrevoProvider] BREVO_API_KEY is required");
    this.apiKey = apiKey;
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const fromAddress = options.from?.email ?? (process.env.EMAIL_FROM_ADDRESS ?? "noreply@kilisense.co.ke");
      const fromName    = options.from?.name   ?? "KiliSense";

      const toList = Array.isArray(options.to) ? options.to : [options.to];

      const body = {
        sender: { name: fromName, email: fromAddress },
        to: toList.map((a) => ({ email: a.email, name: a.name ?? "" })),
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        replyTo: options.replyTo
          ? { email: options.replyTo.email, name: options.replyTo.name ?? "" }
          : undefined,
      };

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify(body),
      });

      const json = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        console.error("[BrevoProvider] API error:", json);
        return {
          success: false,
          error: json?.message ?? `HTTP ${res.status}`,
          provider: this.name,
        };
      }

      return { success: true, messageId: json?.messageId, provider: this.name };
    } catch (err: any) {
      console.error("[BrevoProvider] Unexpected error:", err);
      return { success: false, error: err?.message ?? "Unknown error", provider: this.name };
    }
  }
}

