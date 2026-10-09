import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  CreditCard,
  ArrowDownToLine,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Building,
  DollarSign,
  Smartphone,
  Receipt,
  FileText,
  Percent,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Billing() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: payments = [], isLoading: isPaymentsLoading, refetch: refetchPayments } =
    trpc.subscriptions.listPayments.useQuery();
  const { data: pastDue = [], isLoading: isPastDueLoading, refetch: refetchPastDue } =
    trpc.subscriptions.listPastDue.useQuery();
  const { data: stats } = trpc.admin.getPlatformStats.useQuery();

  // Email mutation for sending payment reminders
  const sendEmailMutation = trpc.admin.sendPlatformEmail.useMutation();

  const handleSendReminder = async (orgName: string, ownerId: number, planName: string, amount: string) => {
    try {
      await sendEmailMutation.mutateAsync({
        recipientIds: [ownerId],
        subject: `Payment Reminder: KiliSense ${planName} Plan Renewal`,
        message: `Hello ${orgName},\n\nYour subscription for the ${planName} plan is currently past due (Amount: KSh ${amount}). Please renew via M-Pesa or Card to prevent service interruption.`,
        templateKey: "payment_reminder",
        callToActionUrl: "https://kilisense.online/settings/organization/billing",
        callToActionLabel: "Renew Subscription",
      });
      toast.success(`Payment reminder sent to ${orgName}.`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send payment reminder.");
    }
  };

  // Financial calculations
  const totalCompletedAmount = payments
    .filter((p) => p.payment.status === "successful")
    .reduce((sum, p) => sum + Number(p.payment.amount || 0), 0);

  const completedCount = payments.filter((p) => p.payment.status === "successful").length;
  const pendingCount = payments.filter((p) => p.payment.status === "pending").length;

  const filteredPayments = payments.filter((p) => {
    const orgName = p.organization?.name?.toLowerCase() || "";
    const method = p.payment.paymentProvider?.toLowerCase() || "";
    const id = String(p.payment.id);
    const q = searchQuery.toLowerCase();
    return orgName.includes(q) || method.includes(q) || id.includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "successful":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-none flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-none flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/15 text-red-600 border-none flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track subscription revenue, tenant invoices, M-Pesa payments, and collection accounts.
          </p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Monthly Recurring Revenue</span>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">
              KSh {(stats?.monthlyRevenue ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Active recurring MRR</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600">Total Collected</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">
              KSh {totalCompletedAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{completedCount} successful invoices</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600">Pending Settlements</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-600">Past Due Accounts</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">{pastDue.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Requires collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="w-4 h-4" /> Invoices & Transactions
          </TabsTrigger>
          <TabsTrigger value="past_due" className="gap-2">
            <AlertTriangle className="w-4 h-4" /> Past Due & Recovery ({pastDue.length})
          </TabsTrigger>
          <TabsTrigger value="gateways" className="gap-2">
            <CreditCard className="w-4 h-4" /> Payment Gateways & Tax
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold text-foreground">Transaction Log</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by org, method..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPaymentsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Loading transaction history...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No transactions recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((p) => {
                      const amountNum = Number(p.payment.amount || 0);
                      const isMpesa = p.payment.paymentProvider?.toLowerCase().includes("mpesa") || p.payment.paymentProvider?.toLowerCase().includes("pesapal");
                      return (
                        <TableRow key={p.payment.id}>
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            INV-{String(p.payment.id).padStart(5, "0")}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground text-sm">
                              {p.organization?.name ?? "Unknown Organization"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {p.organization?.businessType ?? "Farm"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {p.plan?.name ?? "Custom Plan"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs gap-1">
                              {isMpesa ? <Smartphone className="w-3 h-3 text-emerald-600" /> : <CreditCard className="w-3 h-3" />}
                              {p.payment.paymentProvider || "M-Pesa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            KSh {amountNum.toLocaleString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(p.payment.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {p.payment.createdAt
                              ? format(new Date(p.payment.createdAt), "MMM d, yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <a
                              href={`/api/invoices/${p.payment.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                            >
                              <FileText className="w-3.5 h-3.5" /> PDF
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Past Due Tab */}
        <TabsContent value="past_due" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Overdue Tenant Accounts
              </CardTitle>
              <CardDescription>
                Organizations with past-due subscription invoices requiring payment collection.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Current Plan</TableHead>
                    <TableHead>Billing Interval</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPastDueLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Checking overdue records...
                      </TableCell>
                    </TableRow>
                  ) : pastDue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-emerald-600">
                        No accounts are currently past due. All subscriptions are in good standing!
                      </TableCell>
                    </TableRow>
                  ) : (
                    pastDue.map((item) => {
                      const amount =
                        item.subscription.billingInterval === "yearly"
                          ? item.plan?.yearlyPrice ?? "0"
                          : item.plan?.monthlyPrice ?? "0";
                      return (
                        <TableRow key={item.subscription.id}>
                          <TableCell className="font-medium text-foreground">
                            {item.organization?.name}
                          </TableCell>
                          <TableCell>{item.plan?.name}</TableCell>
                          <TableCell className="capitalize text-xs">
                            {item.subscription.billingInterval}
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            KSh {Number(amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-500/15 text-red-600 border-none font-semibold">
                              Past Due
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.subscription.updatedAt
                              ? format(new Date(item.subscription.updatedAt), "MMM d, yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() =>
                                handleSendReminder(
                                  item.organization?.name || "Organization",
                                  item.organization?.ownerId || 0,
                                  item.plan?.name || "Pro",
                                  Number(amount).toLocaleString()
                                )
                              }
                            >
                              <Send className="w-3 h-3" /> Send Reminder
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Gateways Tab */}
        <TabsContent value="gateways" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* M-Pesa Gateway */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-foreground">M-Pesa Daraja API</CardTitle>
                      <CardDescription className="text-xs">Safaricom Express STK Push</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-none">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Currency:</span>
                    <span className="font-semibold text-foreground">KES (Kenyan Shillings)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Flow:</span>
                    <span className="font-medium text-foreground">Automated STK Push Prompt</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Head Office Settlement:</span>
                    <span className="font-medium text-foreground">Nyeri Commercial Hub</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Primary payment method for smallholder farmers and agricultural cooperatives in Kenya.
                </p>
              </CardContent>
            </Card>

            {/* Card & International Gateway */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-foreground">Stripe & Card Payments</CardTitle>
                      <CardDescription className="text-xs">Visa, MasterCard & International</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-none">Enabled</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supported Currencies:</span>
                    <span className="font-semibold text-foreground">KES, USD, EUR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Webhook Status:</span>
                    <span className="font-medium text-emerald-600">Connected (/api/webhooks)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recurring Billing:</span>
                    <span className="font-medium text-foreground">Automated 30-day cycle</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for enterprise agricultural firms and commercial exporters.
                </p>
              </CardContent>
            </Card>

            {/* Tax & Invoicing Policy */}
            <Card className="border-border shadow-sm md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base text-foreground">Tax & Invoicing Regulations</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Statutory tax configuration for Kenyan operations
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <span className="text-muted-foreground block">Kenya VAT Rate</span>
                  <span className="text-base font-bold text-foreground">16.0%</span>
                  <span className="text-[11px] text-muted-foreground block">Included in standard SaaS plans</span>
                </div>
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <span className="text-muted-foreground block">Invoice Dispatch</span>
                  <span className="text-base font-bold text-foreground">Automated</span>
                  <span className="text-[11px] text-muted-foreground block">Sent via email upon receipt</span>
                </div>
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <span className="text-muted-foreground block">Issuer Headquarters</span>
                  <span className="text-base font-bold text-foreground">Nyeri, Kenya</span>
                  <span className="text-[11px] text-muted-foreground block">KiliSense Technologies Ltd</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
