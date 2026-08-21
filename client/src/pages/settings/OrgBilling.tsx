import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";
import { SERVICE_REGISTRY } from "@/lib/serviceRegistry";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";

export default function OrgBilling() {
  const { currentFarm } = useFarm();
  const organizationId = currentFarm?.farm.organizationId ?? 0;

  const { data: subscriptionData, isLoading } = trpc.subscriptions.getOrganizationSubscription.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );

  if (isLoading) return <Skeleton className="h-[400px]" />;

  if (!subscriptionData || !subscriptionData.subscription) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h3 className="text-2xl font-medium text-slate-900 tracking-tight">Subscription & Billing</h3>
          <p className="text-slate-500 mt-1">Manage your organization's subscription plan and billing details.</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium">No Active Subscription</h4>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              Your organization currently does not have an active subscription plan.
              Please contact the platform administrator to set up a plan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subscription, plan, features } = subscriptionData;
  const isPastDue = subscription.status === "past_due";
  const isCancelled = subscription.status === "cancelled";

  const allFeatures = [...MODULE_REGISTRY, ...SERVICE_REGISTRY];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-medium text-slate-900 tracking-tight">Subscription & Billing</h3>
          <p className="text-slate-500 mt-1">Manage your organization's subscription plan and billing details.</p>
        </div>
        <ChangePlanDialog organizationId={organizationId} currentPlanId={plan?.id} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className={isPastDue ? "border-red-200" : "border-slate-200"}>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your organization's active tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-2xl font-semibold">{plan?.name || "Unknown Plan"}</h4>
                <div className="mt-2 text-sm text-slate-500">
                  <Badge variant={
                    subscription.status === 'active' ? 'default' : 
                    subscription.status === 'trialing' ? 'secondary' : 'destructive'
                  }>
                    {subscription.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {plan?.currency} {subscription.billingInterval === 'yearly' ? plan?.yearlyPrice : plan?.monthlyPrice}
                </div>
                <div className="text-sm text-slate-500 capitalize">
                  / {subscription.billingInterval}
                </div>
              </div>
            </div>

            {subscription.currentPeriodEnd && (
              <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {isCancelled ? "Access ends on: " : "Next billing date: "}
                  <span className="font-medium">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>Plan restrictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-slate-500">Max Farms</span>
              <span className="font-medium">{plan?.maxFarms === null ? "Unlimited" : plan?.maxFarms}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-slate-500">Max Users</span>
              <span className="font-medium">{plan?.maxUsers === null ? "Unlimited" : plan?.maxUsers}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-slate-500">Storage Limit</span>
              <span className="font-medium">{plan?.maxStorageMb === null ? "Unlimited" : `${plan?.maxStorageMb} MB`}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Included Features</CardTitle>
          <CardDescription>Modules and services available on your plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {features?.map((f: any) => {
              const featDef = allFeatures.find((af: any) => af.key === f.featureKey);
              return (
                <div key={f.featureKey} className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{(featDef as any)?.label || (featDef as any)?.name || f.featureKey}</span>
                </div>
              );
            })}
            {(!features || features.length === 0) && (
              <div className="text-sm text-slate-500">No specific features enabled.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <PaymentHistory organizationId={organizationId} />
    </div>
  );
}

function ChangePlanDialog({ organizationId, currentPlanId }: { organizationId: number, currentPlanId?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "mpesa">("stripe");
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);

  const { data: plans, isLoading } = trpc.billing.listPublicPlans.useQuery(undefined, { enabled: isOpen });
  const checkout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate checkout");
    }
  });

  const isEnterprise = (p: { name: string; monthlyPrice: number | string }) =>
    p.name.toLowerCase().includes("enterprise") || Number(p.monthlyPrice) === 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Upgrade Plan</Button>
      </DialogTrigger>

      {/* Force a wide modal. Use sm:max-w-[1100px] to override the default sm:max-w-lg from dialog.tsx! */}
      <DialogContent className="w-[calc(100vw-32px)] sm:max-w-[1100px] max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col p-0">

        {/* ── Sticky header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Upgrade Your Plan
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-500">
                Choose the plan that fits your operation.
              </DialogDescription>
            </div>
          
            <div className="flex flex-wrap items-center gap-4">
              {/* Billing interval toggle */}
              <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                <button
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${billingInterval === "monthly" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setBillingInterval("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${billingInterval === "yearly" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setBillingInterval("yearly")}
                >
                  Yearly
                  <span className="ml-1.5 text-[11px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                    −20%
                  </span>
                </button>
              </div>

              {/* Payment method switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">Pay via:</span>
                <button
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${paymentProvider === "stripe" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                  onClick={() => setPaymentProvider("stripe")}
                >
                  Credit Card
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${paymentProvider === "mpesa" ? "bg-green-700 text-white border-green-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                  onClick={() => setPaymentProvider("mpesa")}
                >
                  M-PESA
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable plan grid ── */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans?.map((p) => {
                const isCurrent = p.id === currentPlanId;
                const isEnt = isEnterprise(p);
                const price = billingInterval === "yearly" ? p.yearlyPrice : p.monthlyPrice;
                const isExpanded = expandedPlan === p.id;

                // Key features to show collapsed (first 6)
                const visibleFeatures = p.features.slice(0, 6);
                const hiddenFeatures = p.features.slice(6);

                return (
                  <div
                    key={p.id}
                    className={`
                      relative flex flex-col rounded-2xl border p-5 transition-shadow min-w-0 h-full
                      ${isCurrent
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }
                    `}
                  >
                    {/* Current plan badge */}
                    {isCurrent && (
                      <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                        Current Plan
                      </span>
                    )}

                    {/* Plan name + description */}
                    <div className="mb-4 mt-2">
                      <h3 className="text-base font-semibold text-slate-900 uppercase tracking-wide break-words">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {p.description || (isEnt ? "Full platform access for large operations." : "")}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      {isEnt && Number(price) === 0 ? (
                        <>
                          <div className="text-sm font-medium text-slate-500 uppercase tracking-wider opacity-0">Custom</div>
                          <div className="text-3xl font-bold text-slate-900 mt-1">Custom</div>
                          <p className="text-xs text-slate-500 mt-1">pricing</p>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{p.currency}</div>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-bold text-slate-900">
                              {Number(price).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              /{billingInterval === "yearly" ? "yr" : "mo"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="w-full h-px bg-slate-100 my-4"></div>

                    {/* Usage limits - strictly vertical */}
                    <div className="flex flex-col gap-2.5 text-xs text-slate-700 font-medium mb-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>{p.maxFarms ? `${p.maxFarms} farms` : "Unlimited farms"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>{p.maxUsers ? `${p.maxUsers} users` : "Unlimited users"}</span>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">Features</div>

                    {/* Key features — always visible */}
                    <div className="space-y-2 mb-4 flex-1">
                      {visibleFeatures.map((f) => (
                        <div key={f.featureKey} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                          <span className="capitalize leading-tight">{f.featureKey.replace(/_/g, " ")}</span>
                        </div>
                      ))}

                      {/* Expandable extra features */}
                      {hiddenFeatures.length > 0 && (
                        <>
                          {isExpanded && hiddenFeatures.map((f) => (
                            <div key={f.featureKey} className="flex items-start gap-2 text-xs text-slate-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                              <span className="capitalize leading-tight">{f.featureKey.replace(/_/g, " ")}</span>
                            </div>
                          ))}
                          <button
                            className="text-xs text-primary font-medium hover:underline mt-2 flex items-center"
                            onClick={() => setExpandedPlan(isExpanded ? null : p.id)}
                          >
                            {isExpanded ? "− Show less" : `+ ${hiddenFeatures.length} more features`}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Action button — always at bottom */}
                    <div className="mt-auto pt-5">
                      {isEnt ? (
                        <Button
                          variant="outline"
                          className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 h-10"
                          onClick={() => window.open("mailto:sales@sproutx.app", "_blank")}
                        >
                          Contact Sales
                        </Button>
                      ) : (
                        <Button
                          variant={isCurrent ? "outline" : "default"}
                          className={`w-full h-10 ${isCurrent ? "border-primary/30 text-primary cursor-default hover:bg-transparent hover:text-primary" : ""}`}
                          disabled={isCurrent || checkout.isPending}
                          onClick={() =>
                            checkout.mutate({
                              organizationId,
                              planId: p.id,
                              billingInterval,
                              provider: paymentProvider,
                            })
                          }
                        >
                          {checkout.isPending && checkout.variables?.planId === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          {isCurrent ? "Current Plan" : "Select Plan"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaymentHistory({ organizationId }: { organizationId: number }) {
  const { data: payments, isLoading } = trpc.billing.listMyPayments.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );

  if (isLoading) return <Skeleton className="h-64 mt-6" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View your previous transactions and download invoices.</CardDescription>
      </CardHeader>
      <CardContent>
        {(!payments || payments.length === 0) ? (
          <div className="py-8 text-center text-sm text-slate-500 border border-dashed rounded-lg bg-slate-50">
            No payments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-slate-500">
                  <th className="font-medium p-3">Date</th>
                  <th className="font-medium p-3">Amount</th>
                  <th className="font-medium p-3">Status</th>
                  <th className="font-medium p-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-medium">
                      {p.currency} {p.amount.toString()}
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={p.status === 'successful' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}
                        className={p.status === 'successful' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {p.status === 'successful' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          asChild
                          className="h-8 text-slate-500 hover:text-slate-900"
                        >
                          <a href={`/api/invoices/${p.id}/download`} target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
