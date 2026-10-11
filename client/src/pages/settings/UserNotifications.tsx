import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Smartphone, MessageCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CHANNELS = [
  { key: "push", label: "Push", icon: Bell, available: true },
  { key: "email", label: "Email", icon: Mail, available: true },
  { key: "sms", label: "SMS", icon: Smartphone, available: false },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, available: false },
];

const CATEGORIES = [
  {
    id: "billing",
    title: "Billing & Subscription Reminders",
    desc: "Trial ending alerts (7d/3d/1d), renewal reminders, and payment receipts.",
    prefKey: "billingEmails",
  },
  {
    id: "agri",
    title: "Regional Agronomy Briefings",
    desc: "Anonymous regional disease trends, weather outlooks, and crop market updates.",
    prefKey: "agriInsightEmails",
  },
  {
    id: "digest",
    title: "Farm Performance Digests",
    desc: "Periodic summaries of farm operations, livestock logs, and field milestones.",
    prefKey: "farmDigestEmails",
  },
  {
    id: "security",
    title: "Security & Account Notices",
    desc: "Login alerts, password changes, and access revocation warnings.",
    prefKey: "securityEmails",
  },
];

export default function UserNotifications() {
  const { data: serverPrefs, isLoading } = trpc.users.getEmailPreferences.useQuery();
  const updateMutation = trpc.users.updateEmailPreferences.useMutation();

  const [emailPrefs, setEmailPrefs] = useState({
    billingEmails: true,
    agriInsightEmails: true,
    farmDigestEmails: true,
    securityEmails: true,
  });

  useEffect(() => {
    if (serverPrefs) {
      setEmailPrefs({
        billingEmails: serverPrefs.billingEmails,
        agriInsightEmails: serverPrefs.agriInsightEmails,
        farmDigestEmails: serverPrefs.farmDigestEmails,
        securityEmails: serverPrefs.securityEmails,
      });
    }
  }, [serverPrefs]);

  const handleToggle = (key: keyof typeof emailPrefs) => {
    setEmailPrefs(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(emailPrefs);
      toast.success("Notification preferences saved successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save preferences");
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">Email & Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Control how and when you receive automated emails and platform alerts. SMS and WhatsApp channels will be available in a future update.
        </p>
      </div>

      {/* Channel Legend */}
      <div className="grid grid-cols-4 gap-3">
        {CHANNELS.map(ch => (
          <div key={ch.key} className={cn(
            "flex items-center gap-2.5 p-3 rounded-xl border",
            ch.available ? "border-border bg-card" : "border-border bg-muted opacity-60"
          )}>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
              ch.available ? "bg-muted" : "bg-muted")}>
              <ch.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{ch.label}</p>
              {!ch.available && <p className="text-[10px] text-muted-foreground">Coming soon</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Preferences Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {/* Table Header */}
        <div className="grid bg-muted border-b border-border" style={{ gridTemplateColumns: "1fr 100px 100px 100px 100px" }}>
          <div className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</div>
          {CHANNELS.map(ch => (
            <div key={ch.key} className="py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center flex items-center justify-center gap-1.5">
              <ch.icon className="w-3.5 h-3.5" />
              {ch.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className="grid hover:bg-muted/50 transition-colors items-center"
              style={{ gridTemplateColumns: "1fr 100px 100px 100px 100px" }}
            >
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-foreground">{cat.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cat.desc}</p>
              </div>

              {/* Push placeholder */}
              <div className="flex items-center justify-center py-4">
                <Switch checked={true} disabled={true} />
              </div>

              {/* Email channel with live preference */}
              <div className="flex items-center justify-center py-4">
                <Switch
                  checked={emailPrefs[cat.prefKey as keyof typeof emailPrefs]}
                  disabled={isLoading}
                  onCheckedChange={() => handleToggle(cat.prefKey as keyof typeof emailPrefs)}
                />
              </div>

              {/* SMS coming soon */}
              <div className="flex items-center justify-center py-4">
                <Switch checked={false} disabled={true} />
              </div>

              {/* WhatsApp coming soon */}
              <div className="flex items-center justify-center py-4">
                <Switch checked={false} disabled={true} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          onClick={handleSave}
          disabled={updateMutation.isPending || isLoading}
        >
          {updateMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
          Save Preferences
        </button>
      </div>
    </div>
  );
}

