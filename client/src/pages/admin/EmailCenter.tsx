import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Mail, CheckCircle2, AlertCircle, RefreshCw, Send, Users, ShieldAlert,
  Clock, Filter, Eye, AlertTriangle, Play, Pause, ChevronRight, BarChart3,
  Server, Sparkles, MapPin, Search
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function EmailCenter() {
  const utils = trpc.useContext();
  
  // Queries
  const { data: operationalStats, isLoading: isStatsLoading } = trpc.admin.getEmailOperationalStats.useQuery();
  const { data: rules, isLoading: isRulesLoading } = trpc.admin.getEmailAutomationRules.useQuery();
  const { data: regionalConfigs, isLoading: isConfigsLoading } = trpc.admin.getRegionalBriefingConfigs.useQuery();
  const { data: logs, isLoading: isLogsLoading } = trpc.admin.getPlatformEmailLogs.useQuery();
  const { data: automationLogs, isLoading: isAutoLogsLoading } = trpc.admin.getEmailAutomationLogs.useQuery();
  const { data: recipients, isLoading: isRecipientsLoading } = trpc.admin.getEmailRecipients.useQuery();
  
  // Mutations
  const sendEmailMutation = trpc.admin.sendPlatformEmail.useMutation();
  const sendTestEmailMutation = trpc.admin.sendTestEmail.useMutation();
  const toggleRuleMutation = trpc.admin.toggleEmailAutomationRule.useMutation();
  const updateBriefingMutation = trpc.admin.updateRegionalBriefingConfig.useMutation();
  const triggerBriefingMutation = trpc.admin.triggerRegionalBriefing.useMutation();
  const retryLogMutation = trpc.admin.retryEmailAutomationLog.useMutation();

  // State
  const [activeTab, setActiveTab] = useState("automations");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Test Email State
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testTemplate, setTestTemplate] = useState<any>("trial_ending_3d");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Template Preview Query
  const { data: previewData, isLoading: isPreviewLoading } = trpc.admin.previewEmailTemplate.useQuery(
    { templateKey: testTemplate },
    { enabled: !!testTemplate }
  );

  // Filter & Search State for Dispatches
  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logCategoryFilter, setLogCategoryFilter] = useState("all");
  
  // Selected Details Modals
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  // Compose State
  const [formData, setFormData] = useState({
    recipientGroup: "",
    templateKey: "platform_announcement" as "platform_announcement" | "payment_reminder" | "security_alert" | "custom",
    subject: "",
    message: "",
    callToActionUrl: "",
    callToActionLabel: "",
  });

  const getRecipientIds = () => {
    if (!recipients) return [];
    if (formData.recipientGroup === "all_users") return recipients.users.map(u => u.id);
    if (formData.recipientGroup === "all_farms") return Array.from(new Set(recipients.farms.map(f => f.ownerId)));
    return [];
  };

  const handleSend = async () => {
    const ids = getRecipientIds();
    if (ids.length === 0) {
      toast.error("No recipients selected.");
      setIsConfirmOpen(false);
      return;
    }

    try {
      const result = await sendEmailMutation.mutateAsync({
        recipientIds: ids,
        subject: formData.subject,
        message: formData.message,
        templateKey: formData.templateKey,
        callToActionUrl: formData.callToActionUrl,
        callToActionLabel: formData.callToActionLabel,
      });

      toast.success(`Dispatched to ${result.sentCount} recipients (${result.failedCount} failed)`);
      setIsConfirmOpen(false);
      setFormData({
        ...formData,
        subject: "",
        message: "",
      });
      setActiveTab("history");
      utils.admin.getPlatformEmailLogs.invalidate();
      utils.admin.getEmailOperationalStats.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'sent': 
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent (Provider Accepted)</Badge>;
      case 'delivered': 
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed Delivered</Badge>;
      case 'failed': 
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'queued': 
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none"><Clock className="w-3 h-3 mr-1" /> Queued (Pending)</Badge>;
      case 'skipped':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Skipped (Opt-out / Dedup)</Badge>;
      default: 
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  // Filtered automated logs
  const filteredAutoLogs = useMemo(() => {
    if (!automationLogs) return [];
    return automationLogs.filter((l: any) => {
      if (logStatusFilter !== "all" && l.status !== logStatusFilter) return false;
      if (logCategoryFilter === "billing") {
        if (!l.automationType.includes("trial") && !l.automationType.includes("subscription") && !l.automationType.includes("payment")) return false;
      } else if (logCategoryFilter === "agricultural") {
        if (!l.automationType.includes("agri") && !l.automationType.includes("digest")) return false;
      }
      if (logSearch) {
        const s = logSearch.toLowerCase();
        const matchEmail = l.recipientEmail?.toLowerCase().includes(s);
        const matchOrg = l.orgName?.toLowerCase().includes(s);
        const matchType = l.automationType?.toLowerCase().includes(s);
        if (!matchEmail && !matchOrg && !matchType) return false;
      }
      return true;
    });
  }, [automationLogs, logStatusFilter, logCategoryFilter, logSearch]);

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Stats Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Email Center & Automations</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Operational dashboard, automated trigger lifecycle, and delivery monitoring.
          </p>
        </div>

        {/* Operational Provider Badge */}
        <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-lg text-xs shadow-sm">
          <Server className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Active Provider:</span>
          <span className="font-semibold text-foreground uppercase">{operationalStats?.providerName || "brevo"}</span>
          <span className="text-border">|</span>
          <span className="text-muted-foreground">Next Cron:</span>
          <span className="font-medium text-foreground">{operationalStats?.nextScheduledRun || "08:00 UTC"}</span>
        </div>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Confirmed Sent (Provider)</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {operationalStats?.platformLogs.sent ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Delivered directly to farmer inboxes
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Automated Dispatches</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">
              {operationalStats?.automationLogs.total ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Trial, billing & regional briefing alerts
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Deduplicated / Skipped</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-700">
              {operationalStats?.automationLogs.skipped ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Spam-guarded & user opt-out compliance
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Failed Dispatches</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">
              {operationalStats?.platformLogs.failed ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Provider errors or invalid recipient emails
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="automations" className="gap-2"><Clock className="w-4 h-4" /> Automated Rules</TabsTrigger>
          <TabsTrigger value="testing" className="gap-2"><Sparkles className="w-4 h-4" /> Test Sender & Preview</TabsTrigger>
          <TabsTrigger value="briefings" className="gap-2"><MapPin className="w-4 h-4" /> Regional Briefings</TabsTrigger>
          <TabsTrigger value="compose" className="gap-2"><Send className="w-4 h-4" /> Manual Dispatch</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><BarChart3 className="w-4 h-4" /> Delivery Logs</TabsTrigger>
        </TabsList>

        {/* ── 1. AUTOMATED RULES TAB ── */}
        <TabsContent value="automations" className="space-y-6">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Automated Rules Management</CardTitle>
              <CardDescription>
                Configure, inspect, or pause platform triggers. Mandatory subscription enforcement rules are strictly system-enforced and cannot be paused.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {isRulesLoading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Loading automated rules...</div>
                ) : (
                  rules?.map((rule: any) => (
                    <div key={rule.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/40 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-foreground">{rule.name}</h4>
                          {rule.isSystemEnforced ? (
                            <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 text-[10px] border border-slate-300">
                              System Enforced
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {rule.category}
                            </Badge>
                          )}
                          <Badge className={rule.isEnabled ? "bg-emerald-100 text-emerald-800 border-none text-[10px]" : "bg-slate-100 text-slate-600 border-none text-[10px]"}>
                            {rule.isEnabled ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-2xl">{rule.description}</p>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                          <span><strong>Schedule:</strong> {rule.cronExpression || "Triggered on Event"}</span>
                          <span><strong>Timezone:</strong> {rule.timeZone}</span>
                          <span><strong>Template:</strong> <code className="text-[11px]">{rule.templateKey}</code></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedRule(rule)}
                          className="text-xs h-8"
                        >
                          Details & Context <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>

                        {rule.isSystemEnforced ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled
                            title="Mandatory subscription enforcement cannot be paused by administrators."
                            className="text-xs h-8 text-muted-foreground"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-600" /> Locked
                          </Button>
                        ) : (
                          <Button 
                            variant={rule.isEnabled ? "outline" : "default"} 
                            size="sm"
                            className="text-xs h-8"
                            disabled={toggleRuleMutation.isPending}
                            onClick={async () => {
                              try {
                                await toggleRuleMutation.mutateAsync({
                                  ruleId: rule.id,
                                  isEnabled: !rule.isEnabled,
                                });
                                toast.success(`Rule "${rule.name}" is now ${!rule.isEnabled ? 'active' : 'paused'}`);
                                utils.admin.getEmailAutomationRules.invalidate();
                              } catch (e: any) {
                                toast.error(e.message);
                              }
                            }}
                          >
                            {rule.isEnabled ? <><Pause className="w-3 h-3 mr-1" /> Pause</> : <><Play className="w-3 h-3 mr-1" /> Resume</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. TEST SENDER & RENDERED PREVIEW TAB ── */}
        <TabsContent value="testing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                  <CardTitle>Send Test Email</CardTitle>
                  <CardDescription>
                    Verify exact HTML rendering and delivery without mutating database subscription states.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Target Recipient Address</label>
                    <Input 
                      type="email"
                      value={testEmailAddress} 
                      onChange={e => setTestEmailAddress(e.target.value)} 
                      placeholder="e.g. admin@kilisense.co.ke" 
                    />
                    <p className="text-[11px] text-muted-foreground">Test messages are delivered safely with sample organization context.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Template Selection</label>
                    <Select value={testTemplate} onValueChange={setTestTemplate}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial_started">Trial Started Welcome</SelectItem>
                        <SelectItem value="trial_ending_7d">Trial Ending (7 Days Alert)</SelectItem>
                        <SelectItem value="trial_ending_3d">Trial Ending (3 Days Alert)</SelectItem>
                        <SelectItem value="trial_ending_1d">Trial Ending (1 Day Final Warning)</SelectItem>
                        <SelectItem value="trial_expired">Trial Expired Notice</SelectItem>
                        <SelectItem value="subscription_past_due">Subscription Past Due (7d Grace)</SelectItem>
                        <SelectItem value="subscription_suspended">Subscription Suspended Notice</SelectItem>
                        <SelectItem value="payment_success">Payment Confirmed Receipt</SelectItem>
                        <SelectItem value="payment_failed">Payment Failed Alert</SelectItem>
                        <SelectItem value="plan_changed">Plan Upgrade/Downgrade Changed</SelectItem>
                        <SelectItem value="usage_limit_warning">Usage Limit Warning (90%)</SelectItem>
                        <SelectItem value="farm_digest">Farm Weekly Performance Digest</SelectItem>
                        <SelectItem value="regional_insight">Regional Agronomy Briefing</SelectItem>
                        <SelectItem value="platform_announcement">Platform Announcement</SelectItem>
                        <SelectItem value="security_alert">Account Security Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={!testEmailAddress || sendTestEmailMutation.isPending}
                      onClick={async () => {
                        // Email validation regex
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress)) {
                          toast.error("Please provide a valid recipient email address.");
                          return;
                        }

                        try {
                          const res = await sendTestEmailMutation.mutateAsync({
                            targetEmail: testEmailAddress,
                            templateKey: testTemplate,
                          });
                          if (res.success) {
                            toast.success(`Live test email accepted by ${res.provider}! Message ID: ${res.messageId || 'OK'}`);
                            utils.admin.getPlatformEmailLogs.invalidate();
                            utils.admin.getEmailOperationalStats.invalidate();
                          } else {
                            toast.error(`Dispatch failed: ${res.error || 'Provider rejected request'}`);
                          }
                        } catch (err: any) {
                          toast.error(err.message);
                        }
                      }}
                    >
                      {sendTestEmailMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                      <Send className="w-4 h-4 mr-2" /> Send Test Email
                    </Button>

                    <Button 
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Open Fullscreen HTML Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Guarantee Info */}
              <div className="p-4 rounded-lg border border-border bg-muted/40 text-xs space-y-1.5 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Provider Integration Verified
                </div>
                <p>Emails are dispatched via the active provider ({operationalStats?.providerName}). Queued messages are never marked as delivered until provider acceptance is confirmed.</p>
              </div>
            </div>

            {/* Right Live Render Preview */}
            <div className="lg:col-span-7">
              <Card className="border-border shadow-sm bg-card h-full flex flex-col">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Live Rendered Preview</CardTitle>
                      <CardDescription className="text-xs">Subject: <span className="text-foreground font-medium">{previewData?.subject || "Loading..."}</span></CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">Sandboxed HTML</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-[450px]">
                  {isPreviewLoading ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">Rendering template preview...</div>
                  ) : (
                    <iframe 
                      title="Email Preview"
                      srcDoc={previewData?.html} 
                      className="w-full h-full min-h-[450px] border-none rounded-b-lg bg-white"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── 3. REGIONAL BRIEFINGS CONFIGURATION TAB ── */}
        <TabsContent value="briefings" className="space-y-6">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Regional Agronomy Briefings</CardTitle>
                <CardDescription>
                  Configure automated regional disease alerts and weather patterns. Real verified scan data only — no fabricated activity or private farm disclosures.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {isConfigsLoading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Loading regional briefing configurations...</div>
                ) : (
                  regionalConfigs?.map((cfg: any) => (
                    <div key={cfg.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/40 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-foreground">{cfg.regionName}</h4>
                          <Badge variant="outline" className="text-[10px]">{cfg.county} County</Badge>
                          <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] uppercase">{cfg.frequency}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Requires min. <strong>{cfg.minScanThreshold} verified scans</strong> within 14 days before pest warnings trigger. Weather: {cfg.requireWeatherData ? 'Required' : 'Optional'}. Market: {cfg.requireMarketData ? 'Required' : 'Optional'}.
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Last Dispatched: {cfg.lastDispatchedAt ? format(new Date(cfg.lastDispatchedAt), "MMM d, yyyy h:mm a") : "Never dispatched"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setSelectedConfig(cfg)}
                        >
                          Configure Thresholds
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs h-8 bg-primary hover:bg-primary/90"
                          disabled={triggerBriefingMutation.isPending}
                          onClick={async () => {
                            try {
                              const res = await triggerBriefingMutation.mutateAsync({ configId: cfg.id });
                              if (res.success) {
                                toast.success(res.reason);
                                utils.admin.getEmailAutomationLogs.invalidate();
                                utils.admin.getRegionalBriefingConfigs.invalidate();
                              } else {
                                toast.warning(res.reason);
                              }
                            } catch (e: any) {
                              toast.error(e.message);
                            }
                          }}
                        >
                          {triggerBriefingMutation.isPending && <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />}
                          Trigger Now (Safely)
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 4. MANUAL DISPATCH (COMPOSE) TAB ── */}
        <TabsContent value="compose">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Manual Mass Email Dispatch</CardTitle>
              <CardDescription>Dispatch manual announcements, operational maintenance alerts, or security updates to registered farmers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Target Audience</label>
                  <Select value={formData.recipientGroup} onValueChange={(val) => setFormData({...formData, recipientGroup: val})}>
                    <SelectTrigger><SelectValue placeholder="Select audience..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Registered Users ({recipients?.users?.length || 0})</SelectItem>
                      <SelectItem value="all_farms">All Farm Owners ({new Set(recipients?.farms?.map(f => f.ownerId)).size || 0})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Template</label>
                  <Select value={formData.templateKey} onValueChange={(val: any) => setFormData({...formData, templateKey: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform_announcement">Platform Announcement</SelectItem>
                      <SelectItem value="security_alert">Security Alert</SelectItem>
                      <SelectItem value="custom">Custom Plain Text/HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Subject Line</label>
                <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="e.g. Important Service Notice" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message Body</label>
                <Textarea 
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})} 
                  placeholder="Type your message content..." 
                  className="h-36" 
                />
              </div>

              {formData.templateKey === 'platform_announcement' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Call to Action Label (Optional)</label>
                    <Input value={formData.callToActionLabel} onChange={e => setFormData({...formData, callToActionLabel: e.target.value})} placeholder="e.g. Open Portal" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Call to Action URL (Optional)</label>
                    <Input value={formData.callToActionUrl} onChange={e => setFormData({...formData, callToActionUrl: e.target.value})} placeholder="https://..." />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={!formData.recipientGroup || !formData.subject || !formData.message}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" /> Prepare Dispatch
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 5. DELIVERY LOGS & AUTOMATED DISPATCHES TAB ── */}
        <TabsContent value="history" className="space-y-6">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Recent Automated Dispatches & Deliveries</CardTitle>
                  <CardDescription>Search, filter, and inspect delivery outcomes. Safe retry controls available for failed dispatches.</CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted-foreground" />
                    <Input 
                      placeholder="Search recipient..." 
                      value={logSearch} 
                      onChange={e => setLogSearch(e.target.value)} 
                      className="pl-8 text-xs h-9"
                    />
                  </div>

                  <Select value={logCategoryFilter} onValueChange={setLogCategoryFilter}>
                    <SelectTrigger className="w-36 text-xs h-9"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="billing">Billing Only</SelectItem>
                      <SelectItem value="agricultural">Agricultural Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                    <SelectTrigger className="w-32 text-xs h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target Recipient</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Trigger Type</TableHead>
                    <TableHead>Date Sent</TableHead>
                    <TableHead className="text-right">Delivery Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isAutoLogsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading dispatch history...</TableCell>
                    </TableRow>
                  ) : filteredAutoLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No dispatches match the selected filters.</TableCell>
                    </TableRow>
                  ) : (
                    filteredAutoLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium text-xs">
                          {log.recipientEmail}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.orgName || "Direct / System"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-muted capitalize">
                            {log.automationType.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(log.sentAt), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs px-2"
                              onClick={() => setSelectedLog(log)}
                            >
                              Details
                            </Button>

                            {log.status === "failed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700"
                                disabled={retryLogMutation.isPending}
                                onClick={async () => {
                                  try {
                                    const res = await retryLogMutation.mutateAsync({ logId: log.id });
                                    if (res.success) {
                                      toast.success("Retry dispatched successfully!");
                                      utils.admin.getEmailAutomationLogs.invalidate();
                                      utils.admin.getEmailOperationalStats.invalidate();
                                    } else {
                                      toast.error(`Retry failed: ${res.error}`);
                                    }
                                  } catch (e: any) {
                                    toast.error(e.message);
                                  }
                                }}
                              >
                                Retry
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── RULE DETAILS MODAL ── */}
      <Dialog open={!!selectedRule} onOpenChange={() => setSelectedRule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedRule?.name}</DialogTitle>
            <DialogDescription>{selectedRule?.description}</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3 text-xs">
            <div className="bg-muted p-3 rounded-lg space-y-2 border border-border">
              <div><strong className="text-muted-foreground">Trigger Mechanism:</strong> <span className="font-medium text-foreground">{selectedRule?.triggerType}</span></div>
              <div><strong className="text-muted-foreground">Schedule / Cron:</strong> <span className="font-medium text-foreground">{selectedRule?.cronExpression || "Event Driven"}</span></div>
              <div><strong className="text-muted-foreground">Timezone:</strong> <span className="font-medium text-foreground">{selectedRule?.timeZone}</span></div>
              <div><strong className="text-muted-foreground">Template Key:</strong> <code className="font-mono text-primary">{selectedRule?.templateKey}</code></div>
              <div><strong className="text-muted-foreground">Recipient Rule:</strong> <span className="text-foreground">{selectedRule?.recipientRule}</span></div>
              <div><strong className="text-muted-foreground">System Enforced:</strong> <span className="text-foreground">{selectedRule?.isSystemEnforced ? "Yes (Mandatory Subscription Compliance)" : "No (Can be toggled by admin)"}</span></div>
            </div>
            {selectedRule?.lastExecutionMessage && (
              <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                <strong>Execution Status:</strong> {selectedRule.lastExecutionMessage}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRule(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DISPATCH DETAILS MODAL ── */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dispatch Audit Log #{selectedLog?.id}</DialogTitle>
            <DialogDescription>Full delivery parameters and audit trail.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3 text-xs">
            <div className="bg-muted p-3.5 rounded-lg space-y-2 border border-border">
              <div><strong className="text-muted-foreground">Recipient:</strong> <span className="font-medium text-foreground">{selectedLog?.recipientEmail}</span></div>
              <div><strong className="text-muted-foreground">Organization:</strong> <span className="font-medium text-foreground">{selectedLog?.orgName || "System / Independent"}</span></div>
              <div><strong className="text-muted-foreground">Automation Category:</strong> <span className="font-medium text-foreground">{selectedLog?.automationType}</span></div>
              <div><strong className="text-muted-foreground">Status:</strong> <span className="font-medium text-foreground capitalize">{selectedLog?.status}</span></div>
              <div><strong className="text-muted-foreground">Timestamp:</strong> <span className="font-medium text-foreground">{selectedLog?.sentAt ? format(new Date(selectedLog.sentAt), "PPPpp") : ""}</span></div>
              {selectedLog?.errorMessage && (
                <div className="text-rose-600 pt-2 border-t border-border">
                  <strong>Error Message:</strong>
                  <p className="mt-1 font-mono text-[11px] bg-rose-50 p-2 rounded">{selectedLog.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── REGIONAL CONFIG EDIT MODAL ── */}
      <Dialog open={!!selectedConfig} onOpenChange={() => setSelectedConfig(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {selectedConfig?.regionName}</DialogTitle>
            <DialogDescription>Adjust data-availability requirements and dispatch frequency for {selectedConfig?.county} County.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Dispatch Frequency</label>
              <Select 
                value={selectedConfig?.frequency} 
                onValueChange={(val: any) => setSelectedConfig({ ...selectedConfig, frequency: val })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly (Recommended)</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Minimum Verified Scan Threshold</label>
              <Input 
                type="number"
                min={1}
                max={20}
                value={selectedConfig?.minScanThreshold || 3}
                onChange={e => setSelectedConfig({ ...selectedConfig, minScanThreshold: Number(e.target.value) })}
              />
              <p className="text-[11px] text-muted-foreground">
                Prevents alert fabrication. Regional pest warnings will ONLY trigger if at least this number of real scans exist in {selectedConfig?.county} within 14 days.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded border border-border">
              <div>
                <span className="font-medium text-foreground">Require Weather Data</span>
                <p className="text-[11px] text-muted-foreground">Only send if live local forecasts are retrieved.</p>
              </div>
              <Switch 
                checked={selectedConfig?.requireWeatherData ?? true}
                onCheckedChange={val => setSelectedConfig({ ...selectedConfig, requireWeatherData: val })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConfig(null)}>Cancel</Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              disabled={updateBriefingMutation.isPending}
              onClick={async () => {
                try {
                  await updateBriefingMutation.mutateAsync({
                    id: selectedConfig.id,
                    frequency: selectedConfig.frequency,
                    minScanThreshold: selectedConfig.minScanThreshold,
                    requireWeatherData: selectedConfig.requireWeatherData,
                  });
                  toast.success(`Updated ${selectedConfig.regionName} configuration`);
                  utils.admin.getRegionalBriefingConfigs.invalidate();
                  setSelectedConfig(null);
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FULLSCREEN HTML PREVIEW MODAL ── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Rendered Preview: {previewData?.subject}</DialogTitle>
            <DialogDescription>Interactive view of the {testTemplate} responsive template.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-[500px] border border-border rounded-lg overflow-hidden bg-white">
            <iframe 
              title="Fullscreen Email Preview"
              srcDoc={previewData?.html} 
              className="w-full h-full min-h-[500px] border-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CONFIRM MASS SEND MODAL ── */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Manual Mass Send</DialogTitle>
            <DialogDescription>
              You are about to dispatch an email to {getRecipientIds().length} recipients. This action will log directly to the audit logs.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted p-4 rounded-md border border-border text-sm space-y-2">
              <div className="flex"><strong className="w-24 text-muted-foreground">Audience:</strong> <span>{formData.recipientGroup.replace('_', ' ').toUpperCase()}</span></div>
              <div className="flex"><strong className="w-24 text-muted-foreground">Subject:</strong> <span>{formData.subject}</span></div>
              <div className="flex"><strong className="w-24 text-muted-foreground">Template:</strong> <span>{formData.templateKey.replace('_', ' ')}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSend} 
              disabled={sendEmailMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {sendEmailMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Yes, Dispatch Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
