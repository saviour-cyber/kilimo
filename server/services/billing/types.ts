export interface CheckoutSessionOptions {
  organizationId: number;
  planId: number;
  billingInterval: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerName?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string; // The URL to redirect the user to
  provider: "stripe" | "mpesa";
}

export interface WebhookResult {
  success: boolean;
  event?: any;
  error?: string;
}

export interface IPaymentGateway {
  providerName: "stripe" | "mpesa";
  createCheckoutSession(options: CheckoutSessionOptions): Promise<CheckoutSessionResult>;
  handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookResult>;
}
