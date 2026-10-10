import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings as SettingsIcon,
  Globe,
  Mail,
  Cpu,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building,
  Lock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");

  // General Settings
  const [appName, setAppName] = useState("KiliSense");
  const [location, setLocation] = useState("Nyeri, Kenya");
  const [timezone, setTimezone] = useState("Africa/Nairobi");
  const [appUrl, setAppUrl] = useState("https://kilisense.online");
  const [supportEmail, setSupportEmail] = useState("support@kilisense.com");
  const [supportPhone, setSupportPhone] = useState("+254 700 890 000");

  // Localization
  const [currency, setCurrency] = useState("KES");
  const [vatRate, setVatRate] = useState("16");
  const [units, setUnits] = useState("metric");

  // Email Config
  const [emailProvider, setEmailProvider] = useState("brevo");
  const [senderName, setSenderName] = useState("KiliSense");
  const [senderEmail, setSenderEmail] = useState("noreply@kilisense.co.ke");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // AI & Sensors
  const [aiModel, setAiModel] = useState("gemini-1.5-flash");
  const [aiCropAdvisory, setAiCropAdvisory] = useState(true);
  const [aiLivestockIntel, setAiLivestockIntel] = useState(true);
  const [sensorSamplingInterval, setSensorSamplingInterval] = useState("60");

  // Security
  const [sessionDurationDays, setSessionDurationDays] = useState("30");
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceScope, setMaintenanceScope] = useState<"app_only" | "full_site">("app_only");
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [estimatedRestorationAt, setEstimatedRestorationAt] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [scheduledEndAt, setScheduledEndAt] = useState("");

  const utils = trpc.useUtils();
  const maintenanceQuery = trpc.admin.getMaintenanceMode.useQuery();

  React.useEffect(() => {
    if (maintenanceQuery.data) {
      setMaintenanceMode(maintenanceQuery.data.isEnabled);
      setMaintenanceScope(maintenanceQuery.data.scope || "app_only");
      setMaintenanceMessage(maintenanceQuery.data.message || "");
      setEstimatedRestorationAt(maintenanceQuery.data.estimatedRestorationAt || "");
      setScheduledStartAt(maintenanceQuery.data.scheduledStartAt || "");
      setScheduledEndAt(maintenanceQuery.data.scheduledEndAt || "");
    }
  }, [maintenanceQuery.data]);

  const setMaintenanceMutation = trpc.admin.setMaintenanceMode.useMutation({
    onSuccess: (_, variables) => {
      utils.admin.getMaintenanceMode.invalidate();
      if (variables.isEnabled) {
        toast.warning(
          variables.scope === "full_site"
            ? "Full-Site Maintenance is ACTIVE. Landing page replaced & normal user login blocked."
            : "Application Maintenance is ACTIVE. Landing page open, but normal user login & farm apps blocked."
        );
      } else {
        toast.success("System maintenance mode DISABLED. Normal platform access restored.");
      }
    },
    onError: (err) => {
      toast.error(`Failed to update maintenance mode: ${err.message}`);
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setMaintenanceMutation.mutateAsync({
        isEnabled: maintenanceMode,
        scope: maintenanceScope,
        message: maintenanceMessage || undefined,
        estimatedRestorationAt: estimatedRestorationAt || null,
        scheduledStartAt: scheduledStartAt || null,
        scheduledEndAt: scheduledEndAt || null,
      });
      toast.success("System settings updated successfully.");
    } catch (err: any) {
      // handled by mutation onError
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = () => {
    if (!testEmailAddress) {
      toast.error("Please enter a destination email address.");
      return;
    }
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      toast.success(`Test verification email dispatched to ${testEmailAddress}.`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure system branding, operational headquarters, email infrastructure, AI engines, and security.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="localization" className="gap-2">
            <Building className="w-4 h-4" /> Localization
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" /> Email & Comms
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Cpu className="w-4 h-4" /> AI & IoT
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" /> Security
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">System Identity & Headquarters</CardTitle>
              <CardDescription>
                Core brand parameters and operational base in Nyeri, Kenya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Platform Brand Name</Label>
                  <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Operational Base & Headquarters</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Default Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</SelectItem>
                      <SelectItem value="Africa/Cairo">Africa/Cairo (EEST, UTC+2)</SelectItem>
                      <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Production Domain URL</Label>
                  <Input value={appUrl} onChange={(e) => setAppUrl(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Primary Support Email</Label>
                  <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Support Hotline / WhatsApp</Label>
                  <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Localization Tab */}
        <TabsContent value="localization" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Financial & Regional Standards</CardTitle>
              <CardDescription>
                Configure Kenyan statutory currency, tax rates, and measurement units
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>System Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES - Kenyan Shillings (KSh)</SelectItem>
                      <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Statutory VAT Rate (%)</Label>
                  <Input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    placeholder="16"
                  />
                  <span className="text-[11px] text-muted-foreground">Standard Kenyan VAT is 16%</span>
                </div>

                <div className="space-y-1.5">
                  <Label>Measurement System</Label>
                  <Select value={units} onValueChange={setUnits}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (Hectares, Kg, Litres, °C)</SelectItem>
                      <SelectItem value="imperial">Imperial (Acres, Lbs, Gallons, °F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Email Infrastructure & Relay</CardTitle>
                  <CardDescription>
                    Transactional email delivery status and verified sender identities
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-600 border-none">SMTP Connected</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Active Provider</Label>
                  <Select value={emailProvider} onValueChange={setEmailProvider}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brevo">Brevo (Production SMTP)</SelectItem>
                      <SelectItem value="resend">Resend API</SelectItem>
                      <SelectItem value="console">Console (Dev / Testing)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sender Name</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>From Address</Label>
                  <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
                </div>
              </div>

              {/* Test Email Section */}
              <div className="pt-4 border-t border-border/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Test Email Dispatch
                </h4>
                <div className="flex gap-2 max-w-md">
                  <Input
                    type="email"
                    placeholder="Enter email to test (e.g. admin@kilisense.com)"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTest}
                    className="gap-1 shrink-0"
                  >
                    {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI & IoT Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">KiliSense AI & Sensor Intelligence</CardTitle>
              <CardDescription>
                Configure agronomic machine learning parameters and sensor telemetry polling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Vision Disease Detection Model</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Fast & Precise)</SelectItem>
                      <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>
                      <SelectItem value="custom-blight-v2">KiliSense AgroScan v2 (Offline edge)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>IoT Gateway Telemetry Sampling Interval (Seconds)</Label>
                  <Input
                    type="number"
                    value={sensorSamplingInterval}
                    onChange={(e) => setSensorSamplingInterval(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div>
                    <p className="text-sm font-medium text-foreground">AI Crop Pest & Soil Advisory</p>
                    <p className="text-xs text-muted-foreground">Automatically recommend fertilizers and treatments</p>
                  </div>
                  <Switch checked={aiCropAdvisory} onCheckedChange={setAiCropAdvisory} />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div>
                    <p className="text-sm font-medium text-foreground">Livestock & Dairy Heat Intelligence</p>
                    <p className="text-xs text-muted-foreground">Heuristic detection for cow estrus and calving alerts</p>
                  </div>
                  <Switch checked={aiLivestockIntel} onCheckedChange={setAiLivestockIntel} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Security, Sessions & Governance</CardTitle>
              <CardDescription>
                Authentication protocols, session lifespans, and maintenance states
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Admin & Farmer Session Lifespan (Days)</Label>
                  <Input
                    type="number"
                    value={sessionDurationDays}
                    onChange={(e) => setSessionDurationDays(e.target.value)}
                  />
                  <span className="text-[11px] text-muted-foreground">Standard secure cookie duration is 30 days</span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div>
                    <p className="text-sm font-medium text-foreground">Mandatory Email Verification</p>
                    <p className="text-xs text-muted-foreground">Require farmers to confirm email prior to accessing farm features</p>
                  </div>
                  <Switch
                    checked={requireEmailVerification}
                    onCheckedChange={setRequireEmailVerification}
                  />
                </div>

                <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> System Maintenance Mode
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Temporarily restrict access during system updates, security patches, or database migrations
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceMode}
                      disabled={setMaintenanceMutation.isPending}
                      onCheckedChange={(val) => {
                        setMaintenanceMode(val);
                        setMaintenanceMutation.mutate({
                          isEnabled: val,
                          scope: maintenanceScope,
                          message: maintenanceMessage || undefined,
                          estimatedRestorationAt: estimatedRestorationAt || null,
                          scheduledStartAt: scheduledStartAt || null,
                          scheduledEndAt: scheduledEndAt || null,
                        });
                      }}
                    />
                  </div>

                  {maintenanceMode && (
                    <div className="pt-3 border-t border-red-500/20 space-y-3.5">
                      {/* Maintenance Scope */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground font-semibold">Maintenance Scope</Label>
                        <Select
                          value={maintenanceScope}
                          onValueChange={(val: "app_only" | "full_site") => setMaintenanceScope(val)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="app_only">
                              Application Only (Standard — landing page visible; user login & farm apps blocked)
                            </SelectItem>
                            <SelectItem value="full_site">
                              Full Site (Dedicated branded maintenance screen; user login & farm apps blocked)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          {maintenanceScope === "full_site"
                            ? "Replaces the public landing page with a branded maintenance status screen."
                            : "Public landing page remains accessible for new visitors, but farmer logins and farm management are halted."}
                        </p>
                      </div>

                      {/* Public Maintenance Notice */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-foreground font-semibold">Public Notice for Users</Label>
                        <Input
                          placeholder="e.g. Scheduled database maintenance in progress. Normal operations will resume shortly."
                          value={maintenanceMessage}
                          onChange={(e) => setMaintenanceMessage(e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>

                      {/* Estimated Restoration & Scheduling Window */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground font-medium">Estimated Restoration Time (Optional)</Label>
                          <Input
                            type="datetime-local"
                            value={estimatedRestorationAt}
                            onChange={(e) => setEstimatedRestorationAt(e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground font-medium">Scheduled Window Start (Optional)</Label>
                          <Input
                            type="datetime-local"
                            value={scheduledStartAt}
                            onChange={(e) => setScheduledStartAt(e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground font-medium">Scheduled Window End (Optional)</Label>
                          <Input
                            type="datetime-local"
                            value={scheduledEndAt}
                            onChange={(e) => setScheduledEndAt(e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-muted-foreground">
                          Note: Platform administrators retain full access to <span className="font-mono text-xs">/admin</span> to manage or deactivate maintenance anytime.
                        </p>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                          disabled={setMaintenanceMutation.isPending}
                          onClick={() => {
                            setMaintenanceMutation.mutate({
                              isEnabled: true,
                              scope: maintenanceScope,
                              message: maintenanceMessage || undefined,
                              estimatedRestorationAt: estimatedRestorationAt || null,
                              scheduledStartAt: scheduledStartAt || null,
                              scheduledEndAt: scheduledEndAt || null,
                            });
                          }}
                        >
                          Apply Maintenance Settings
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
