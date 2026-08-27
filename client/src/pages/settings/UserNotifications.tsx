import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Smartphone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { key: "push", label: "Push", icon: Bell, available: true },
  { key: "email", label: "Email", icon: Mail, available: true },
  { key: "sms", label: "SMS", icon: Smartphone, available: false },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, available: false },
];

const CATEGORIES = [
  {
    id: "iot",
    title: "IoT Alerts",
    desc: "Critical sensor thresholds, gateway offline status, and hardware errors.",
    defaults: { push: true, email: true, sms: false, whatsapp: false },
  },
  {
    id: "disease",
    title: "Disease Alerts",
    desc: "AI scan results, local pest warnings, and quarantine recommendations.",
    defaults: { push: true, email: true, sms: false, whatsapp: false },
  },
  {
    id: "weather",
    title: "Weather Alerts",
    desc: "Frost warnings, heavy rainfall predictions, and extreme heat advisories.",
    defaults: { push: true, email: false, sms: false, whatsapp: false },
  },
  {
    id: "finance",
    title: "Finance Alerts",
    desc: "Budget overruns, invoice receipts, and subscription renewals.",
    defaults: { push: true, email: true, sms: false, whatsapp: false },
  },
];

export default function UserNotifications() {
  const [prefs, setPrefs] = useState<Record<string, Record<string, boolean>>>(
    Object.fromEntries(CATEGORIES.map(c => [c.id, { ...c.defaults }]))
  );

  const toggle = (categoryId: string, channel: string) => {
    setPrefs(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [channel]: !prev[categoryId][channel] },
    }));
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Control how and when you receive alerts. SMS and WhatsApp channels will be available in a future update.
        </p>
      </div>

      {/* Channel Legend */}
      <div className="grid grid-cols-4 gap-3">
        {CHANNELS.map(ch => (
          <div key={ch.key} className={cn(
            "flex items-center gap-2.5 p-3 rounded-xl border",
            ch.available ? "border-border bg-white" : "border-border bg-muted opacity-60"
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
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid bg-muted border-b border-border" style={{ gridTemplateColumns: "1fr 100px 100px 100px 100px" }}>
          <div className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notification Category</div>
          {CHANNELS.map(ch => (
            <div key={ch.key} className="py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center flex items-center justify-center gap-1.5">
              <ch.icon className="w-3.5 h-3.5" />
              {ch.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
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
              {CHANNELS.map(ch => (
                <div key={ch.key} className="flex items-center justify-center py-4">
                  <Switch
                    checked={prefs[cat.id]?.[ch.key] ?? false}
                    disabled={!ch.available}
                    onCheckedChange={() => toggle(cat.id, ch.key)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          onClick={() => {/* TODO: persist to backend */}}
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
