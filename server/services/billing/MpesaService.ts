import type { CheckoutSessionOptions, CheckoutSessionResult, IPaymentGateway, WebhookResult } from "./types";

export class MpesaService implements IPaymentGateway {
  providerName = "mpesa" as const;

  async createCheckoutSession(options: CheckoutSessionOptions): Promise<CheckoutSessionResult> {
    // In a real implementation (e.g. Daraja API or Pesapal), we would initiate an STK push
    // or create a redirect URL for a hosted checkout page.
    // For now, this is a placeholder that simulates a successful creation and returns a mock URL.
    
    console.log("[MpesaService] Creating mock checkout session for M-PESA", options);
    
    // Simulate Daraja/Pesapal API call
    return {
      sessionId: `mpesa_mock_${Date.now()}`,
      url: `/settings/organization/billing?mpesa_mock=true`, // Redirect back with a flag
      provider: "mpesa",
    };
  }

  async handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookResult> {
    // Validate signature/IP based on Safaricom/Pesapal documentation
    return { success: true, event: JSON.parse(rawBody.toString()) };
  }
}

export const mpesaService = new MpesaService();
