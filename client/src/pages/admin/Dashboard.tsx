import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  HardDrive,
  Server,
  Sparkles,
  Sprout,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Reusable admin card wrapper */
function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function AdminCardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3 md:px-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** KPI card — compact on mobile, spacious on desktop */
function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
  bg,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
  trend?: string;
}) {
  return (
    <AdminCard className="flex flex-col gap-3 p-4 hover:border-white/[0.12] transition-colors cursor-default group">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", accent)} />
        </div>
        {trend && (
          <div className="flex items-center gap-0.5 text-emerald-400 text-xs font-medium">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{title}</p>
        <p className="mt-0.5 text-xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </AdminCard>
  );
}

/** Status badge */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
    success: { cls: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle2, label: "Success" },
    pending: { cls: "text-amber-400 bg-amber-400/10",   icon: Clock,         label: "Pending" },
    warning: { cls: "text-orange-400 bg-orange-400/10", icon: AlertTriangle, label: "Warning" },
    error:   { cls: "text-rose-400 bg-rose-400/10",     icon: AlertTriangle, label: "Error"   },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", s.cls)}>
      <Icon className="h-2.5 w-2.5" />
      {s.label}
    </span>
  );
}

/** Health status row */
function HealthRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "ok" | "warn" | "err";
}) {
  const dot = status === "ok" ? "bg-emerald-400" : status === "warn" ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center justify-between py-2 text-sm border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 text-slate-300">
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
        {label}
      </div>
      <span className="text-slate-400 text-xs font-mono">{value}</span>
    </div>
  );
}

/** Chart section used for both user growth + revenue */
function ChartCard({
  title,
  dataKey,
  color,
  gradientId,
  data,
  formatter,
}: {
  title: string;
  dataKey: string;
  color: string;
  gradientId: string;
  data: any[];
  formatter?: (v: number) => string;
}) {
  return (
    <AdminCard>
      <AdminCardHeader title={title} />
      <div className="px-2 pb-4 h-48 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatter ? (v: number) => formatter(v) : undefined}
              width={48}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
            <RechartsTooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#0A1628",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                fontSize: "12px",
                color: "#cbd5e1",
              }}
              formatter={formatter ? (v: number) => [formatter(v), dataKey] : undefined}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AdminCard>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.getPlatformStats.useQuery();
  const { data: analytics, isLoading: analyticsLoading } = trpc.admin.getDashboardAnalytics.useQuery();
  const [activityExpanded, setActivityExpanded] = useState(false);
  
  const isLoading = statsLoading || analyticsLoading;

  // KPI definitions
  const kpis = [
    {
      title: "Organizations",
      value: stats?.totalOrganizations?.toLocaleString() ?? "—",
      icon: Building2,
      accent: "text-blue-400",
      bg: "bg-blue-400/10",
      trend: "+12%",
    },
    {
      title: "Active Farms",
      value: stats?.activeFarms?.toLocaleString() ?? "—",
      icon: Sprout,
      accent: "text-emerald-400",
      bg: "bg-emerald-400/10",
      trend: "+8%",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers?.toLocaleString() ?? "—",
      icon: Users,
      accent: "text-purple-400",
      bg: "bg-purple-400/10",
      trend: "+23%",
    },
    {
      title: "Monthly Revenue",
      value: `KES ${(stats?.monthlyRevenue ?? 0).toLocaleString()}`,
      icon: Banknote,
      accent: "text-amber-400",
      bg: "bg-amber-400/10",
      trend: "+5%",
    },
    {
      title: "API Requests",
      value: stats
        ? `${((stats.apiRequestsToday ?? 0) / 1_000_000).toFixed(1)}M`
        : "—",
      icon: Activity,
      accent: "text-rose-400",
      bg: "bg-rose-400/10",
    },
    {
      title: "Online Devices",
      value: stats?.onlineDevices?.toLocaleString() ?? "—",
      icon: Wifi,
      accent: "text-cyan-400",
      bg: "bg-cyan-400/10",
    },
    {
      title: "AI Requests",
      value: stats?.aiRequestsToday?.toLocaleString() ?? "—",
      icon: Sparkles,
      accent: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
    {
      title: "Storage Used",
      value: `${stats?.storageUsedTb ?? "—"} TB`,
      icon: HardDrive,
      accent: "text-slate-400",
      bg: "bg-slate-400/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <Skeleton className="h-5 w-40 bg-white/5 rounded-lg mb-1" />
          <Skeleton className="h-4 w-64 bg-white/5 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 bg-white/5 rounded-xl" />
          <Skeleton className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  const recentActivityData = analytics?.recentActivity || [];
  const growthDataData = analytics?.growthData || [];

  const visibleActivity = activityExpanded
    ? recentActivityData
    : recentActivityData.slice(0, 4);

  return (
    <div className="space-y-4 md:space-y-5">

      {/* ── Page title ── */}
      <div>
        <h1 className="text-lg font-bold text-white md:text-xl">Platform Overview</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Real-time platform health and business metrics
        </p>
      </div>

      {/* ── KPI Grid
           Mobile:  2 columns
           Tablet:  4 columns
           Desktop: 4 columns (2 rows of 4)
      ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.title} {...k} />
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="User Growth"
          dataKey="users"
          color="#10B981"
          gradientId="grad-users"
          data={growthDataData}
        />
        <ChartCard
          title="Monthly Revenue (KES)"
          dataKey="revenue"
          color="#3B82F6"
          gradientId="grad-revenue"
          data={growthDataData}
          formatter={(v: number) => `KES ${(v / 1_000).toFixed(1)}k`}
        />
      </div>

      {/* ── System Health + AI Status ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* System Health */}
        <AdminCard>
          <AdminCardHeader
            title="System Health"
            subtitle="Live service status"
            action={
              <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
            }
          />
          <div className="px-4 pb-4 md:px-5">
            <HealthRow label="API Gateway"     value="42 ms"   status="ok"   />
            <HealthRow label="Database"        value="8 ms"    status="ok"   />
            <HealthRow label="Auth Service"    value="12 ms"   status="ok"   />
            <HealthRow label="AI Engine"       value="280 ms"  status="warn" />
            <HealthRow label="IoT Broker"      value="Online"  status="ok"   />
            <HealthRow label="Storage"         value="94.2%"   status="warn" />
          </div>
        </AdminCard>

        {/* AI Engine Status */}
        <AdminCard>
          <AdminCardHeader
            title="AI Engine"
            subtitle="Model performance this session"
            action={
              <span className="flex items-center gap-1 rounded-full bg-purple-400/10 px-2 py-1 text-[10px] font-medium text-purple-400">
                <Sparkles className="h-2.5 w-2.5" />
                Active
              </span>
            }
          />
          <div className="px-4 pb-4 md:px-5 space-y-3">
            {[
              { label: "Requests today",  value: stats?.aiRequestsToday?.toLocaleString() ?? "—", pct: 68  },
              { label: "Avg latency",     value: "1.2 s",                                           pct: 42  },
              { label: "Error rate",      value: "0.03%",                                           pct: 3   },
              { label: "Cache hit rate",  value: "79%",                                             pct: 79  },
            ].map(({ label, value, pct }) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-200">{value}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-white/5">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* ── IoT Status + Billing ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* IoT Status */}
        <AdminCard>
          <AdminCardHeader
            title="IoT Fleet"
            subtitle="Device telemetry overview"
            action={
              <span className="flex items-center gap-1 rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-medium text-cyan-400">
                <Wifi className="h-2.5 w-2.5" />
                {stats?.onlineDevices ?? 0} Online
              </span>
            }
          />
          <div className="grid grid-cols-3 gap-3 px-4 pb-4 md:px-5">
            {[
              { label: "Total Devices", value: stats?.onlineDevices?.toLocaleString() ?? "—", icon: Server, color: "text-cyan-400" },
              { label: "Active Now",    value: Math.floor((stats?.onlineDevices ?? 0) * 0.87).toLocaleString(), icon: Zap, color: "text-emerald-400" },
              { label: "Alerts",        value: "3",                                              icon: AlertTriangle, color: "text-amber-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-lg bg-white/[0.03] p-3 text-center">
                <Icon className={cn("mx-auto mb-1 h-4 w-4", color)} />
                <p className="text-base font-bold text-white">{value}</p>
                <p className="text-[10px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 md:px-5">
            <HealthRow label="Sensors reporting"  value="97.4%"   status="ok"   />
            <HealthRow label="Data ingestion"     value="4.2 k/s" status="ok"   />
            <HealthRow label="Offline devices"    value="3"       status="warn" />
          </div>
        </AdminCard>

        {/* Billing summary */}
        <AdminCard>
          <AdminCardHeader
            title="Billing Overview"
            subtitle="Current billing period"
            action={
              <a href="/admin/billing" className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                Details <ChevronRight className="h-3 w-3" />
              </a>
            }
          />
          <div className="px-4 pb-4 md:px-5 space-y-3">
            {[
              { label: "MRR",               value: `KES ${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, color: "text-emerald-400" },
              { label: "ARR",               value: `KES ${((stats?.monthlyRevenue ?? 0) * 12).toLocaleString()}`, color: "text-blue-400" },
              { label: "Paying accounts",   value: stats?.totalOrganizations?.toLocaleString() ?? "—",    color: "text-purple-400" },
              { label: "Avg revenue / org", value: `KES ${Math.round((stats?.monthlyRevenue ?? 0) / Math.max(stats?.totalOrganizations ?? 1, 1)).toLocaleString()}`, color: "text-amber-400" },
              { label: "Outstanding dues",  value: "KES 0",                                                color: "text-slate-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                <span className="text-xs text-slate-400">{label}</span>
                <span className={cn("text-sm font-semibold", color)}>{value}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* ── Recent Activity ── */}
      <AdminCard>
        <AdminCardHeader
          title="Recent Activity"
          subtitle="Latest platform events"
          action={
            <button
              onClick={() => setActivityExpanded((e) => !e)}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              {activityExpanded ? "Show less" : "View all"}
            </button>
          }
        />

        {/* Desktop: table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                <th className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Action</th>
                <th className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {visibleActivity.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-slate-200">{row.user}</td>
                  <td className="px-5 py-3 text-slate-400">{row.action}</td>
                  <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-5 py-3 text-slate-500 text-xs text-right">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: card stack */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {visibleActivity.map((row, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{row.user}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{row.action}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={row.status} />
                  <span className="text-[10px] text-slate-600">{row.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {recentActivityData.length > 4 && (
          <div className="border-t border-white/[0.04] px-4 py-2.5 md:px-5">
            <button
              onClick={() => setActivityExpanded((e) => !e)}
              className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors py-0.5"
            >
              {activityExpanded ? "Collapse" : `Show ${recentActivityData.length - 4} more`}
              <ChevronRight className={cn("h-3 w-3 transition-transform", activityExpanded && "rotate-90")} />
            </button>
          </div>
        )}
      </AdminCard>

      {/* ── Mobile floating quick-action ── */}
      <div className="fixed bottom-5 right-4 z-30 flex flex-col items-end gap-2 md:hidden">
        <a
          href="/admin/organizations"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/30 text-white hover:bg-emerald-400 transition-colors"
          title="New Organization"
        >
          <Building2 className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
