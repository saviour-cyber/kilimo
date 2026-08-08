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
  
  const { data: plans, isLoading } = trpc.billing.listPublicPlans.useQuery(undefined, { enabled: isOpen });
  const checkout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe or Mpesa placeholder
      window.location.href = data.url;
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate checkout");
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Upgrade Plan</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose a Plan</DialogTitle>
          <DialogDescription>
            Select the plan that best fits your farm's needs.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingInterval === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                  onClick={() => setBillingInterval('monthly')}
                >
                  Monthly
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingInterval === 'yearly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                  onClick={() => setBillingInterval('yearly')}
                >
                  Yearly <span className="text-green-600 text-xs ml-1">-20%</span>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {plans?.map((p) => {
                const isCurrent = p.id === currentPlanId;
                const price = billingInterval === 'yearly' ? p.yearlyPrice : p.monthlyPrice;
                
                return (
                  <Card key={p.id} className={`relative flex flex-col ${isCurrent ? 'border-primary ring-1 ring-primary' : 'border-slate-200'}`}>
                    {isCurrent && (
                      <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-sm z-10">
                        Current
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <CardDescription className="h-10 text-xs">{p.description}</CardDescription>
                      <div className="pt-2">
                        <span className="text-3xl font-bold">{p.currency} {price.toString()}</span>
                        <span className="text-sm text-slate-500">/{billingInterval === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between pt-0 pb-6">
                      <div className="space-y-3 mb-6">
                        <div className="text-sm">
                          <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-500" />
                          {p.maxFarms ? `Up to ${p.maxFarms} farms` : 'Unlimited farms'}
                        </div>
                        <div className="text-sm">
                          <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-500" />
                          {p.maxUsers ? `Up to ${p.maxUsers} users` : 'Unlimited users'}
                        </div>
                        <div className="text-sm font-medium pt-2 border-t mt-2">Features</div>
                        {p.features.map(f => (
                          <div key={f.featureKey} className="text-xs flex items-start">
                            <CheckCircle2 className="w-3 h-3 inline mr-1.5 text-green-500 mt-0.5 shrink-0" />
                            <span>{f.featureKey}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        variant={isCurrent ? "outline" : "default"} 
                        className="w-full"
                        disabled={isCurrent || checkout.isPending}
                        onClick={() => checkout.mutate({
                          organizationId,
                          planId: p.id,
                          billingInterval,
                          provider: paymentProvider,
                        })}
                      >
                        {checkout.isPending && checkout.variables?.planId === p.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {isCurrent ? "Current Plan" : "Select Plan"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between border border-slate-100">
              <div>
                <h4 className="text-sm font-medium">Payment Method</h4>
                <p className="text-xs text-slate-500">Select how you want to pay</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={paymentProvider === 'stripe' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setPaymentProvider('stripe')}
                >
                  Credit Card (Stripe)
                </Button>
                <Button 
                  variant={paymentProvider === 'mpesa' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setPaymentProvider('mpesa')}
                >
                  M-PESA
                </Button>
              </div>
            </div>
          </div>
        )}
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
