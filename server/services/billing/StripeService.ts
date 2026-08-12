import Stripe from "stripe";
import { getDb } from "../../db";
import { subscriptionPlans } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { CheckoutSessionOptions, CheckoutSessionResult, IPaymentGateway, WebhookResult } from "./types";

export class StripeService implements IPaymentGateway {
  providerName = "stripe" as const;
  private stripe: Stripe | null = null;
  private endpointSecret: string | null = null;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    this.endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || null;
    
    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: "2024-06-20" as any, // Use the latest API version or the one installed
        typescript: true,
      });
      console.log("[StripeService] Initialized Stripe client");
    } else {
      console.warn("[StripeService] STRIPE_SECRET_KEY not found in environment. Stripe integration is disabled.");
    }
  }

  async createCheckoutSession(options: CheckoutSessionOptions): Promise<CheckoutSessionResult> {
    if (!this.stripe) {
      throw new Error("Stripe is not configured on this environment.");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the plan details
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, options.planId)).limit(1);
    if (!plan) {
      throw new Error(`Plan with ID ${options.planId} not found`);
    }

    const amount = options.billingInterval === "yearly" ? Number(plan.yearlyPrice) : Number(plan.monthlyPrice);
    
    // Convert to smallest currency unit (cents/pesewas)
    // Assuming KES/USD which both have 2 decimal places typically for Stripe, though KES doesn't use cents locally much, Stripe expects it in smallest unit.
    const unitAmount = Math.round(amount * 100);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: `SproutX ${plan.name} Plan (${options.billingInterval})`,
              description: plan.description || undefined,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: options.billingInterval === "yearly" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      customer_email: options.customerEmail,
      metadata: {
        organizationId: options.organizationId.toString(),
        planId: options.planId.toString(),
        billingInterval: options.billingInterval,
      },
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session URL");
    }

    return {
      sessionId: session.id,
      url: session.url,
      provider: "stripe",
    };
  }

  async handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookResult> {
    if (!this.stripe || !this.endpointSecret) {
      return { success: false, error: "Stripe not configured (missing secret/key)" };
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.endpointSecret
      );
      return { success: true, event };
    } catch (err: any) {
      console.error("[StripeService] Webhook signature verification failed:", err.message);
      return { success: false, error: err.message };
    }
  }
}

export const stripeService = new StripeService();
