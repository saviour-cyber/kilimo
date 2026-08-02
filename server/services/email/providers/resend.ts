// ─── Resend Provider ──────────────────────────────────────────────────────────
// Requires env var: RESEND_API_KEY
// Docs: https://resend.com/docs

import type { IEmailProvider, SendEmailOptions, SendEmailResult } from "../types";

export class ResendProvider implements IEmailProvider {
  readonly name = "resend";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("[ResendProvider] RESEND_API_KEY is required");
    this.apiKey = apiKey;
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const { Resend } = await import("resend");
      const client = new Resend(this.apiKey);

      const from = options.from
        ? `${options.from.name ?? "KilimoHub"} <${options.from.email}>`
        : process.env.EMAIL_FROM_ADDRESS ?? "KilimoHub <noreply@kilimohub.co.ke>";

      const to = Array.isArray(options.to)
        ? options.to.map((a) => (a.name ? `${a.name} <${a.email}>` : a.email))
        : options.to.name
          ? `${options.to.name} <${options.to.email}>`
          : options.to.email;

      const { data, error } = await client.emails.send({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo
          ? (options.replyTo.name
              ? `${options.replyTo.name} <${options.replyTo.email}>`
              : options.replyTo.email)
          : undefined,
      });

      if (error) {
        console.error("[ResendProvider] Send error:", error);
        return { success: false, error: error.message, provider: this.name };
      }

      return { success: true, messageId: data?.id, provider: this.name };
    } catch (err: any) {
      console.error("[ResendProvider] Unexpected error:", err);
      return { success: false, error: err?.message ?? "Unknown error", provider: this.name };
    }
  }
}
