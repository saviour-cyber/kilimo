// ─── Console Provider ─────────────────────────────────────────────────────────
// Logs emails to console instead of sending them.
// Used automatically when EMAIL_PROVIDER=console or no provider is configured.
// Perfect for local development — no API key required.

import type { IEmailProvider, SendEmailOptions, SendEmailResult } from "../types";

export class ConsoleProvider implements IEmailProvider {
  readonly name = "console";

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const to = Array.isArray(options.to) ? options.to : [options.to];
    const toList = to.map((a) => (a.name ? `${a.name} <${a.email}>` : a.email)).join(", ");

    console.log("\n" + "═".repeat(60));
    console.log("📧  EMAIL (console provider — not actually sent)");
    console.log("═".repeat(60));
    console.log(`  To      : ${toList}`);
    console.log(`  Subject : ${options.subject}`);
    if (options.text) {
      console.log("─".repeat(60));
      console.log(options.text);
    }
    console.log("═".repeat(60) + "\n");

    return { success: true, messageId: `console-${Date.now()}`, provider: this.name };
  }
}
