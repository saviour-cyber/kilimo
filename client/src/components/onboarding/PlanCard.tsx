import { Check, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PlanData {
  id: number;
  name: string;
  description: string | null;
  monthlyPrice: string;
  yearlyPrice: string;
  currency: string;
  trialDays: number;
  maxFarms: number | null;
  maxUsers: number | null;
  maxDevices: number | null;
  isActive: boolean;
  isRecommended: boolean;
  isDefaultTrial: boolean;
  features: { featureKey: string; featureType: string }[];
}

interface PlanCardProps {
  plan: PlanData;
  billingInterval: "monthly" | "yearly";
  /** Whether this card is currently selected (wizard mode) */
  selected?: boolean;
  /** Called when user clicks to select this plan */
  onSelect?: (plan: PlanData) => void;
  /** CTA button label shown on landing page */
  ctaLabel?: string;
  /** Called when CTA button clicked on landing page */
  onCta?: () => void;
  /** If true, renders in compact selectable card mode (wizard) */
  compact?: boolean;
}

// Human-readable module/service labels
const FEATURE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  crop: "Crops",
  livestock: "Livestock",
  inventory: "Inventory",
  finance: "Finance",
  tasks: "Tasks",
  disease: "Disease Detection",
  iot: "IoT Sensors",
  reports: "Reports",
  weather: "Weather",
  settings: "Settings",
  ai_assistant: "AI Assistant",
  intelligence: "Intelligence",
};

export function PlanCard({
  plan,
  billingInterval,
  selected,
  onSelect,
  ctaLabel,
  onCta,
  compact = false,
}: PlanCardProps) {
  const price =
    billingInterval === "yearly" ? Number(plan.yearlyPrice) : Number(plan.monthlyPrice);
  const isFree = price === 0;

  return (
    <div
      onClick={() => onSelect?.(plan)}
      className={cn(
        "relative flex flex-col rounded-2xl border transition-all duration-200",
        compact ? "p-5 cursor-pointer" : "p-6",
        plan.isRecommended
          ? "border-primary shadow-lg shadow-primary/10 bg-primary/5"
          : "border-border bg-card",
        selected && "ring-2 ring-primary border-primary shadow-lg shadow-primary/15",
        onSelect && !selected && "hover:border-primary/50 hover:shadow-md"
      )}
    >
      {/* Recommended badge */}
      {plan.isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold shadow-md gap-1">
            <Star className="w-3 h-3 fill-current" />
            Recommended
          </Badge>
        </div>
      )}

      {/* Trial badge */}
      {plan.isDefaultTrial && !plan.isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="secondary" className="px-3 py-0.5 text-xs font-semibold gap-1">
            <Zap className="w-3 h-3" />
            Default Trial
          </Badge>
        </div>
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      {/* Plan name + price */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        {plan.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>
        )}

        <div className="mt-3 flex items-baseline gap-1">
          {isFree ? (
            <span className="text-3xl font-extrabold text-foreground">Free</span>
          ) : (
            <>
              <span className="text-3xl font-extrabold text-foreground">
                {plan.currency} {price.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                /{billingInterval === "yearly" ? "yr" : "mo"}
              </span>
            </>
          )}
        </div>

        {billingInterval === "yearly" && !isFree && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Save {Math.round(((Number(plan.monthlyPrice) * 12 - Number(plan.yearlyPrice)) / (Number(plan.monthlyPrice) * 12)) * 100)}% vs monthly
          </p>
        )}
      </div>

      {/* Trial info */}
      {plan.trialDays > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          🎉 {plan.trialDays}-day free trial included
        </p>
      )}

      {/* Limits */}
      {!compact && (
        <div className="text-xs text-muted-foreground space-y-1 mb-4">
          <div>Farms: <span className="font-medium text-foreground">{plan.maxFarms ?? "Unlimited"}</span></div>
          <div>Users: <span className="font-medium text-foreground">{plan.maxUsers ?? "Unlimited"}</span></div>
          {plan.maxDevices !== null && (
            <div>IoT Devices: <span className="font-medium text-foreground">{plan.maxDevices}</span></div>
          )}
        </div>
      )}

      {/* Features list */}
      <div className="flex-1 space-y-2 mb-5">
        {plan.features.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No specific features configured</p>
        ) : (
          plan.features.map((f) => (
            <div key={f.featureKey} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-primary" />
              </div>
              <span className="text-sm text-foreground">
                {FEATURE_LABELS[f.featureKey] ?? f.featureKey}
              </span>
            </div>
          ))
        )}
      </div>

      {/* CTA button (landing page mode) */}
      {ctaLabel && (
        <Button
          onClick={(e) => { e.stopPropagation(); onCta?.(); }}
          className={cn("w-full", plan.isRecommended ? "" : "variant-outline")}
          variant={plan.isRecommended ? "default" : "outline"}
          size="lg"
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
