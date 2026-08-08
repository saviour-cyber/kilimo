export * from "./types";
export * from "./StripeService";
export * from "./MpesaService";

import { stripeService } from "./StripeService";
import { mpesaService } from "./MpesaService";
import type { IPaymentGateway } from "./types";

export function getPaymentGateway(provider: "stripe" | "mpesa"): IPaymentGateway {
  if (provider === "stripe") return stripeService;
  if (provider === "mpesa") return mpesaService;
  throw new Error(`Unknown payment provider: ${provider}`);
}
