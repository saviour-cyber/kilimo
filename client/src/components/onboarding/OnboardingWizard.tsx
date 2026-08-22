import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useFarm } from "@/contexts/FarmContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlanCard, type PlanData } from "./PlanCard";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";
import { toast } from "sonner";
import {
  Building2, CreditCard, Rocket, Settings2, Check,
  ChevronRight, ChevronLeft, Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

// â”€â”€â”€ Step metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STEPS = [
  { id: 1, label: "Organization", icon: Building2 },
  { id: 2, label: "Choose Plan",  icon: CreditCard },
  { id: 3, label: "Start Trial",  icon: Rocket },
  { id: 4, label: "Farm Setup",   icon: Settings2 },
];

// â”€â”€â”€ Progress indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                  isDone
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                    ? "bg-background border-primary text-primary"
                    : "bg-background border-border text-muted-foreground"
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-12 sm:w-16 mx-1 mb-5 transition-colors",
                  currentStep > step.id ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€â”€ Main Wizard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function OnboardingWizard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { refetchFarms, switchFarm } = useFarm();
  const [step, setStep] = useState(1);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  // Form state across all steps
  const [org, setOrg] = useState({
    orgName: "",
    businessType: "mixed_farming",
    country: "Kenya",
    county: "",
    currency: "KES",
    timezone: "Africa/Nairobi",
  });

  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);

  const [farm, setFarm] = useState({
    farmName: "",
    farmSize: "",
    unit: "Hectares",
  });

  // Load plans from API (public endpoint)
  const { data: plans = [], isLoading: plansLoading } = trpc.subscriptions.listPlans.useQuery();
  const activePlans = plans.filter((p) => p.isActive) as PlanData[];

  const setupMutation = trpc.onboarding.setup.useMutation({
    onSuccess: async (data) => {
      await refetchFarms();
      switchFarm(data.farmId);
      toast.success("Welcome to KiliSense! Your trial has started.");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  // Module-type features from the selected plan (for display only â€” backend auto-provisions)
  const planModuleFeatures = (selectedPlan?.features ?? [])
    .filter((f) => f.featureType === "module")
    .map((f) => MODULE_REGISTRY.find((m) => m.key === f.featureKey))
    .filter(Boolean) as typeof MODULE_REGISTRY;

  const handleFinish = () => {
    if (!user || !selectedPlan) return;
    setupMutation.mutate({
      userId: user.id,
      ...org,
      planId: selectedPlan.id,
      billingInterval,
      farmName: farm.farmName,
      farmSize: Number(farm.farmSize) || 0,
      unit: farm.unit,
      modules: [], // backend auto-provisions all plan-granted modules
    });
  };

  // â”€â”€ Step 1: Organization Setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Set up your organization</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This represents your business on KiliSense.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="orgName">Organization Name *</Label>
          <Input
            id="orgName"
            placeholder="e.g. Savannah Farms Ltd"
            value={org.orgName}
            onChange={(e) => setOrg({ ...org, orgName: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Business Type</Label>
            <Select
              value={org.businessType}
              onValueChange={(v) => setOrg({ ...org, businessType: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed_farming">Mixed Farming</SelectItem>
                <SelectItem value="crop_farming">Crop Farming</SelectItem>
                <SelectItem value="livestock_farming">Livestock Farming</SelectItem>
                <SelectItem value="poultry">Poultry</SelectItem>
                <SelectItem value="aquaculture">Aquaculture</SelectItem>
                <SelectItem value="agribusiness">Agribusiness</SelectItem>
                <SelectItem value="cooperative">Cooperative</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={org.country} onValueChange={(v) => setOrg({ ...org, country: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Kenya">Kenya</SelectItem>
                <SelectItem value="Uganda">Uganda</SelectItem>
                <SelectItem value="Tanzania">Tanzania</SelectItem>
                <SelectItem value="Rwanda">Rwanda</SelectItem>
                <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                <SelectItem value="Nigeria">Nigeria</SelectItem>
                <SelectItem value="Ghana">Ghana</SelectItem>
                <SelectItem value="South Africa">South Africa</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="county">County / Region (optional)</Label>
          <Input
            id="county"
            placeholder="e.g. Nakuru County"
            value={org.county}
            onChange={(e) => setOrg({ ...org, county: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={org.currency} onValueChange={(v) => setOrg({ ...org, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="KES">KES (KSh)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="UGX">UGX (USh)</SelectItem>
                <SelectItem value="TZS">TZS (TSh)</SelectItem>
                <SelectItem value="NGN">NGN (â‚¦)</SelectItem>
                <SelectItem value="GHS">GHS (â‚µ)</SelectItem>
                <SelectItem value="ZAR">ZAR (R)</SelectItem>
                <SelectItem value="EUR">EUR (â‚¬)</SelectItem>
                <SelectItem value="GBP">GBP (Â£)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={org.timezone} onValueChange={(v) => setOrg({ ...org, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                <SelectItem value="Africa/Kampala">Africa/Kampala</SelectItem>
                <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</SelectItem>
                <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                <SelectItem value="Africa/Accra">Africa/Accra</SelectItem>
                <SelectItem value="Africa/Johannesburg">Africa/Johannesburg</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={() => setStep(2)}
        disabled={!org.orgName.trim()}
      >
        Continue <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  // â”€â”€ Step 2: Choose Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Choose your plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          All plans come with a free trial. You can change your plan anytime.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 p-1 bg-muted rounded-lg w-fit mx-auto">
        <button
          onClick={() => setBillingInterval("monthly")}
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
            billingInterval === "monthly"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground"
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingInterval("yearly")}
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
            billingInterval === "yearly"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground"
          )}
        >
          Yearly
          <Badge variant="secondary" className="text-xs py-0 px-1.5 text-emerald-600">Save up to 20%</Badge>
        </button>
      </div>

      {plansLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : activePlans.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-2xl">
          <p className="text-muted-foreground text-sm">
            No subscription plans are available yet. Please contact support.
          </p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-5 pt-4",
          activePlans.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
          activePlans.length === 2 ? "md:grid-cols-2" :
          "md:grid-cols-3"
        )}>
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingInterval={billingInterval}
              selected={selectedPlan?.id === plan.id}
              onSelect={setSelectedPlan}
              compact
            />
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          className="flex-2"
          onClick={() => setStep(3)}
          disabled={!selectedPlan}
        >
          Continue <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  // â”€â”€ Step 3: Start Trial â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Start your free trial</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your selection before we set everything up.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Organization</span>
          <span className="font-semibold text-foreground">{org.orgName}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Plan</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{selectedPlan?.name}</span>
            {selectedPlan?.isRecommended && (
              <Badge variant="secondary" className="text-xs">Recommended</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Billing</span>
          <span className="font-semibold text-foreground capitalize">{billingInterval}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price after trial</span>
          <span className="font-semibold text-foreground">
            {selectedPlan?.currency}{" "}
            {billingInterval === "yearly"
              ? Number(selectedPlan?.yearlyPrice).toLocaleString()
              : Number(selectedPlan?.monthlyPrice).toLocaleString()}
            /{billingInterval === "yearly" ? "yr" : "mo"}
          </span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <span className="text-sm font-medium">ðŸŽ‰ Free trial period</span>
          <span className="font-bold">{selectedPlan?.trialDays} days</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        No credit card required. Cancel anytime during the trial.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          className="flex-2"
          onClick={() => setStep(4)}
        >
          Start Trial <Rocket className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  // â”€â”€ Step 4: Configure Farm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderStep4 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Configure your farm</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your first farm. All modules in your plan will be activated automatically.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="farmName">Farm Name *</Label>
          <Input
            id="farmName"
            placeholder="e.g. Green Valley Farm"
            value={farm.farmName}
            onChange={(e) => setFarm({ ...farm, farmName: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="farmSize">Farm Size</Label>
            <Input
              id="farmSize"
              type="number"
              placeholder="0"
              value={farm.farmSize}
              onChange={(e) => setFarm({ ...farm, farmSize: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select value={farm.unit} onValueChange={(v) => setFarm({ ...farm, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Hectares">Hectares</SelectItem>
                <SelectItem value="Acres">Acres</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Auto-provisioned modules â€” read-only display */}
      {planModuleFeatures.length > 0 && (
        <div className="space-y-2">
          <Label>Modules included in your <strong>{selectedPlan?.name}</strong> plan</Label>
          <p className="text-xs text-muted-foreground">
            These will be automatically activated for your farm. You can disable any module later in Settings.
          </p>
          <div className="grid grid-cols-2 gap-2 border rounded-xl p-4 bg-muted/20">
            {planModuleFeatures.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.key}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background/60"
                >
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <Icon className={cn("w-4 h-4 flex-shrink-0", mod.color)} />
                  <span className="text-sm font-medium">{mod.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          className="flex-2"
          onClick={handleFinish}
          disabled={!farm.farmName.trim() || setupMutation.isPending}
        >
          {setupMutation.isPending ? "Setting up..." : "Launch My Farm ðŸš€"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to KiliSense</h1>
          <p className="text-sm text-muted-foreground mt-1">Let's get your farm set up in a few steps</p>
        </div>

        <StepIndicator currentStep={step} />

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
}

