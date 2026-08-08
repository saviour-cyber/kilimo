import { Router } from "express";
import express from "express";
import { stripeService } from "../services/billing";
import { getDb } from "../db";
import { subscriptions, subscriptionPayments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const webhooksRouter = Router();

// Stripe requires the raw body to construct the event
webhooksRouter.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      return res.status(400).send("Missing stripe-signature header");
    }

    const result = await stripeService.handleWebhook(req.body, signature);

    if (!result.success || !result.event) {
      return res.status(400).send(`Webhook Error: ${result.error}`);
    }

    const event = result.event;

    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          
          if (session.payment_status === "paid") {
            const orgId = parseInt(session.metadata?.organizationId);
            const planId = parseInt(session.metadata?.planId);
            const billingInterval = session.metadata?.billingInterval;

            if (orgId && planId) {
              // Mark subscription as active
              await db.update(subscriptions)
                .set({
                  status: "active",
                  planId: planId,
                  billingInterval: billingInterval as any,
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.organizationId, orgId));
              
              // Record successful payment
              await db.insert(subscriptionPayments).values({
                organizationId: orgId,
                subscriptionId: (await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.organizationId, orgId)).limit(1))[0]?.id || 0,
                amount: (session.amount_total! / 100).toString(),
                currency: session.currency?.toUpperCase() || "USD",
                status: "successful",
                billingInterval: billingInterval as any,
                paymentProvider: "stripe",
                providerTransactionId: session.payment_intent as string,
                paidAt: new Date(),
              });
              
              console.log(`[Webhook] Activated subscription for org ${orgId} on plan ${planId}`);
            }
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          // Implement dunning logic later
          console.warn(`[Webhook] Payment failed for invoice ${invoice.id}`);
          break;
        }
        default:
          console.log(`[Webhook] Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Webhook] Error processing event:", err.message);
      res.status(500).send("Internal Server Error");
    }
  }
);
