import { type ReactNode } from "react";
import { useEntitlement } from "@/hooks/useEntitlement";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Zap } from "lucide-react";
import { Link } from "wouter";

interface SubscriptionGateProps {
  /** The module or service key to check entitlement for */
  featureKey: string;
  /** The display name of the feature (shown in the upgrade prompt) */
  featureName?: string;
  /** Content to render when entitlement is granted */
  children: ReactNode;
  /**
   * Optional fallback UI. If not provided, a default upgrade prompt is shown.
   */
  fallback?: ReactNode;
}

/**
 * SubscriptionGate
 *
 * Wraps content that requires a subscription entitlement.
 * If the org's plan does not include the feature, a paywall/upgrade CTA is shown.
 *
 * Do NOT use this for admin-level gating — use adminProcedure on the server for that.
 * This component is purely for user-facing feature access control.
 *
 * @example
 * <SubscriptionGate featureKey="iot" featureName="IoT Monitoring">
 *   <IoTPage />
 * </SubscriptionGate>
 */
export function SubscriptionGate({
  featureKey,
  featureName,
  children,
  fallback,
}: SubscriptionGateProps) {
  const { isEntitled, isLoading, hasNoSubscription } = useEntitlement(featureKey);

  if (isLoading) {
    // While checking, render children optimistically to avoid layout flash
    return <>{children}</>;
  }

  if (isEntitled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full border-dashed">
        <CardContent className="flex flex-col items-center text-center gap-4 py-10 px-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {featureName ? `${featureName} not included` : "Feature not available"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {hasNoSubscription
                ? "Your organization does not have an active subscription. Please contact your administrator."
                : `Your current plan does not include access to ${featureName ?? "this feature"}. Upgrade to unlock it.`}
            </p>
          </div>

          {!hasNoSubscription && (
            <Link href="/settings/organization/billing">
              <Button className="gap-2">
                <Zap className="w-4 h-4" />
                View Subscription
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
