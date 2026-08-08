import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Plus, Check, Settings, Shield, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";
import { SERVICE_REGISTRY } from "@/lib/serviceRegistry";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Subscriptions() {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tenant subscriptions, tiers, and billing.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="active">Active Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="past_due">Past Due</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <PlansManager />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <ActiveSubscriptionsManager />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentsManager />
        </TabsContent>

        <TabsContent value="past_due" className="space-y-4">
          <PastDueManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlansManager() {
  const utils = trpc.useUtils();
  const { data: plans, isLoading } = trpc.subscriptions.listPlans.useQuery();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const createPlan = trpc.subscriptions.createPlan.useMutation({
    onSuccess: () => {
      toast.success("Plan created successfully");
      utils.subscriptions.listPlans.invalidate();
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const updatePlan = trpc.subscriptions.updatePlan.useMutation({
    onSuccess: () => {
      toast.success("Plan updated successfully");
      utils.subscriptions.listPlans.invalidate();
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
  }

  const allModules = MODULE_REGISTRY.map(m => ({ key: m.key, label: m.label, type: "module" as const }));
  const allServices = SERVICE_REGISTRY.map(s => ({ key: s.key, label: s.name, type: "service" as const }));
  const availableFeatures = [...allModules, ...allServices];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Subscription Plans</h2>
        <Button onClick={() => { setEditingPlan(null); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`border ${plan.isActive ? 'border-primary/20' : 'border-muted'} relative flex flex-col`}>
            {!plan.isActive && (
              <div className="absolute top-4 right-4"><Badge variant="outline">Inactive</Badge></div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="h-10 text-sm overflow-hidden text-ellipsis line-clamp-2">
                {plan.description || "No description"}
              </CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{plan.currency} {Number(plan.monthlyPrice).toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-2 mb-6">
                <div className="text-sm">
                  <span className="font-medium">Trial:</span> {plan.trialDays} days
                </div>
                <div className="text-sm">
                  <span className="font-medium">Farms:</span> {plan.maxFarms === null ? "Unlimited" : plan.maxFarms}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Users:</span> {plan.maxUsers === null ? "Unlimited" : plan.maxUsers}
                </div>
              </div>

              <div className="text-sm font-medium mb-2">Included Features:</div>
              <ScrollArea className="h-24 mb-4 border rounded-md p-2">
                <div className="flex flex-wrap gap-1">
                  {plan.features.map(f => {
                    const featDef = availableFeatures.find(af => af.key === f.featureKey);
                    return (
                      <Badge key={f.featureKey} variant="secondary" className="text-xs">
                        {featDef?.label || f.featureKey}
                      </Badge>
                    );
                  })}
                  {plan.features.length === 0 && <span className="text-xs text-muted-foreground">No features specified</span>}
                </div>
              </ScrollArea>

              <div className="mt-auto pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setEditingPlan(plan);
                    setIsDialogOpen(true);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {plans?.length === 0 && (
          <div className="col-span-full p-8 text-center border border-dashed rounded-lg">
            <p className="text-muted-foreground">No plans have been created yet.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              Define the pricing, limits, and features for this plan.
            </DialogDescription>
          </DialogHeader>
          
          <PlanForm 
            initialData={editingPlan} 
            availableFeatures={availableFeatures}
            onSubmit={(data) => {
              if (editingPlan) {
                updatePlan.mutate({ id: editingPlan.id, ...data });
              } else {
                createPlan.mutate(data);
              }
            }} 
            isPending={createPlan.isPending || updatePlan.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanForm({ initialData, availableFeatures, onSubmit, isPending }: { 
  initialData: any, 
  availableFeatures: {key: string, label: string, type: "module"|"service"}[], 
  onSubmit: (data: any) => void,
  isPending: boolean
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    monthlyPrice: initialData?.monthlyPrice ? Number(initialData.monthlyPrice) : 0,
    yearlyPrice: initialData?.yearlyPrice ? Number(initialData.yearlyPrice) : 0,
    currency: initialData?.currency || "KES",
    trialDays: initialData?.trialDays ?? 14,
    maxFarms: initialData?.maxFarms ?? null,
    maxUsers: initialData?.maxUsers ?? null,
    isActive: initialData?.isActive ?? true,
    sortOrder: initialData?.sortOrder ?? 0,
    features: initialData?.features?.map((f: any) => f.featureKey) || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      features: formData.features.map((fKey: string) => {
        const feat = availableFeatures.find(f => f.key === fKey);
        return { featureKey: fKey, featureType: feat?.type || "module" };
      })
    });
  };

  const toggleFeature = (featureKey: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureKey)
        ? prev.features.filter((f: string) => f !== featureKey)
        : [...prev.features, featureKey]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input 
                value={formData.currency} 
                onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Monthly Price</Label>
              <Input 
                type="number" step="0.01" min="0"
                value={formData.monthlyPrice} 
                onChange={e => setFormData(prev => ({ ...prev, monthlyPrice: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Yearly Price</Label>
              <Input 
                type="number" step="0.01" min="0"
                value={formData.yearlyPrice} 
                onChange={e => setFormData(prev => ({ ...prev, yearlyPrice: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Trial Days</Label>
              <Input 
                type="number" min="0"
                value={formData.trialDays} 
                onChange={e => setFormData(prev => ({ ...prev, trialDays: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Farms (Leave blank for unlimited)</Label>
              <Input 
                type="number" min="1"
                value={formData.maxFarms || ""} 
                onChange={e => setFormData(prev => ({ ...prev, maxFarms: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Users (Leave blank for unlimited)</Label>
              <Input 
                type="number" min="1"
                value={formData.maxUsers || ""} 
                onChange={e => setFormData(prev => ({ ...prev, maxUsers: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              checked={formData.isActive}
              onCheckedChange={c => setFormData(prev => ({ ...prev, isActive: c }))}
              id="is-active"
            />
            <Label htmlFor="is-active">Plan is active and available</Label>
          </div>

          <div className="space-y-3">
            <Label>Included Features (Modules & Services)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border p-4 rounded-md">
              {availableFeatures.map(f => (
                <div key={f.key} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`feat-${f.key}`} 
                    checked={formData.features.includes(f.key)}
                    onCheckedChange={() => toggleFeature(f.key)}
                  />
                  <Label htmlFor={`feat-${f.key}`} className="text-sm font-normal">
                    {f.label} <span className="text-xs text-muted-foreground">({f.type})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="pt-4 border-t mt-4 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Plan"}
        </Button>
      </div>
    </form>
  );
}

function ActiveSubscriptionsManager() {
  const utils = trpc.useUtils();
  const { data: subscriptions, isLoading } = trpc.subscriptions.listSubscriptions.useQuery();
  const { data: plans } = trpc.subscriptions.listPlans.useQuery();
  
  const updateStatus = trpc.subscriptions.updateSubscriptionStatus.useMutation({
    onSuccess: () => {
      toast.success("Subscription status updated");
      utils.subscriptions.listSubscriptions.invalidate();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const changePlan = trpc.subscriptions.changeSubscriptionPlan.useMutation({
    onSuccess: () => {
      toast.success("Subscription plan changed");
      utils.subscriptions.listSubscriptions.invalidate();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Tenant Subscriptions</h2>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left">
              <th className="p-3 font-medium">Organization</th>
              <th className="p-3 font-medium">Plan</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Interval</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions?.map((sub) => (
              <tr key={sub.subscription.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-3">
                  <div className="font-medium">{sub.organization?.name || "Unknown Org"}</div>
                  <div className="text-xs text-muted-foreground">{sub.organization?.contactEmail}</div>
                </td>
                <td className="p-3">
                  {sub.plan ? sub.plan.name : "None"}
                </td>
                <td className="p-3">
                  <Badge variant={sub.subscription.status === 'active' ? 'default' : sub.subscription.status === 'trialing' ? 'secondary' : 'destructive'}>
                    {sub.subscription.status}
                  </Badge>
                </td>
                <td className="p-3 capitalize">{sub.subscription.billingInterval}</td>
                <td className="p-3 flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Update</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage Subscription</DialogTitle>
                        <DialogDescription>
                          Update the status or plan for {sub.organization?.name}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={sub.subscription.status}
                            onChange={(e) => updateStatus.mutate({ 
                              subscriptionId: sub.subscription.id, 
                              status: e.target.value as any 
                            })}
                            disabled={updateStatus.isPending}
                          >
                            <option value="trialing">Trialing</option>
                            <option value="active">Active</option>
                            <option value="past_due">Past Due</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Plan</Label>
                          <select 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={sub.subscription.planId}
                            onChange={(e) => changePlan.mutate({ 
                              subscriptionId: sub.subscription.id, 
                              newPlanId: parseInt(e.target.value) 
                            })}
                            disabled={changePlan.isPending}
                          >
                            {plans?.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
            {subscriptions?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No active subscriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsManager() {
  const { data: payments, isLoading } = trpc.subscriptions.listPayments.useQuery();

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Payment History</h2>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left">
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Organization</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Provider</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments?.map((paymentRecord) => (
              <tr key={paymentRecord.payment.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-3">
                  {new Date(paymentRecord.payment.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div className="font-medium">{paymentRecord.organization?.name || "Unknown Org"}</div>
                  <div className="text-xs text-muted-foreground">{paymentRecord.plan?.name}</div>
                </td>
                <td className="p-3 font-medium">
                  {paymentRecord.payment.currency} {paymentRecord.payment.amount.toString()}
                </td>
                <td className="p-3 capitalize">{paymentRecord.payment.paymentProvider || "System"}</td>
                <td className="p-3">
                  <Badge 
                    variant={
                      paymentRecord.payment.status === 'successful' ? 'default' : 
                      paymentRecord.payment.status === 'pending' ? 'secondary' : 
                      'destructive'
                    }
                  >
                    {paymentRecord.payment.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {payments?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PastDueManager() {
  const utils = trpc.useUtils();
  const { data: pastDue, isLoading } = trpc.subscriptions.listPastDue.useQuery();
  
  const updateStatus = trpc.subscriptions.updateSubscriptionStatus.useMutation({
    onSuccess: () => {
      toast.success("Subscription status updated");
      utils.subscriptions.listPastDue.invalidate();
      utils.subscriptions.listSubscriptions.invalidate();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Past Due Subscriptions</h2>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left">
              <th className="p-3 font-medium">Organization</th>
              <th className="p-3 font-medium">Plan</th>
              <th className="p-3 font-medium">Due Since</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pastDue?.map((sub) => (
              <tr key={sub.subscription.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-3">
                  <div className="font-medium">{sub.organization?.name || "Unknown Org"}</div>
                  <div className="text-xs text-muted-foreground">{sub.organization?.contactEmail}</div>
                </td>
                <td className="p-3">
                  {sub.plan ? sub.plan.name : "None"}
                </td>
                <td className="p-3">
                  {new Date(sub.subscription.updatedAt).toLocaleDateString()}
                </td>
                <td className="p-3 flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() => {
                      if (confirm(`Suspend subscription for ${sub.organization?.name}?`)) {
                        updateStatus.mutate({ 
                          subscriptionId: sub.subscription.id, 
                          status: "suspended",
                          cancelReason: "Suspended due to non-payment"
                        });
                      }
                    }}
                  >
                    Suspend
                  </Button>
                </td>
              </tr>
            ))}
            {pastDue?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No past due subscriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
