import { useFarm } from "@/contexts/FarmContext";
import { getAllWidgets, getQuickActions, type DashboardWidgetDefinition } from "@/lib/moduleRegistry";
import { getAllServiceWidgets } from "@/lib/serviceRegistry";
import { trpc } from "@/lib/trpc";
import { useGrantedModules } from "@/hooks/useEntitlement";
import { Link } from "wouter";
import { Bell, ChevronRight, Menu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Priorities & Sorting ─────────────────────────────────────────────────────
const priorityValue = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

function sortWidgets(a: DashboardWidgetDefinition, b: DashboardWidgetDefinition) {
  const pA = priorityValue[a.priority.level];
  const pB = priorityValue[b.priority.level];
  if (pA !== pB) return pB - pA;
  return a.priority.order - b.priority.order;
}

// ─── Sizing Helper ────────────────────────────────────────────────────────────
function getSizeClasses(size: string) {
  switch (size) {
    case "small": return "col-span-1";
    case "medium": return "col-span-1"; 
    case "large": return "col-span-1 md:col-span-2 lg:col-span-3"; // Spans wider for Kili AI
    default: return "col-span-1";
  }
}

// ─── Global Quick Actions Component ───────────────────────────────────────────
function GlobalQuickActions({ farmId, className }: { farmId: number; className?: string }) {
  const { enabledModules } = useFarm();
  const { modules: grantedModules } = useGrantedModules();
  const effectiveModules = enabledModules.filter(m => grantedModules.includes(m));
  
  const actions = getQuickActions(effectiveModules);

  if (actions.length === 0) return null;

  return (
    <Card className={cn("border shadow-sm bg-white flex flex-col", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-green-50">
            <span className="text-green-700 font-bold text-lg leading-none">+</span>
          </div>
          <span className="font-bold text-[13px] text-slate-800">Quick Actions</span>
        </div>
      </div>
      <CardContent className="p-4 flex flex-col justify-between flex-1">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {actions.map((action) => (
            <Link key={action.path + action.label} href={action.path}>
              <button
                className={cn(
                  "w-full flex items-center justify-center rounded-lg border px-2 py-2.5",
                  "text-center text-[11px] font-semibold transition-all hover:shadow-sm",
                  "hover:opacity-90",
                  action.color
                )}
              >
                + {action.label}
              </button>
            </Link>
          ))}
        </div>

        <Link href="/settings">
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-auto text-xs text-green-600 font-bold h-8 shrink-0 hover:text-green-700 hover:bg-green-50"
          >
            View All Actions <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Main Layout Engine ───────────────────────────────────────────────────────
export default function Dashboard() {
  const { currentFarm, enabledModules } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const { modules: grantedModules } = useGrantedModules();
  const effectiveModules = enabledModules.filter(m => grantedModules.includes(m));

  // 1. Collect all raw widgets
  const moduleWidgets = getAllWidgets(effectiveModules);
  const serviceWidgets = getAllServiceWidgets();

  const allWidgets = [
    ...Object.values(moduleWidgets).flat(),
    ...Object.values(serviceWidgets).flat(),
  ];

  // 2. Group & Sort by priority
  const kpis = allWidgets
    .filter((w) => w.type === "kpi")
    .sort(sortWidgets);

  const intelligence = allWidgets
    .filter((w) => w.type === "intelligence")
    .sort(sortWidgets);

  const systemHeaders = allWidgets
    .filter((w) => w.type === "system" && w.size === "small")
    .sort(sortWidgets);

  const mainGrid = allWidgets
    .filter((w) => ["summary", "activity", "utility", "system"].includes(w.type) && w.size !== "small")
    .sort(sortWidgets);

  const { data: notifCount } = trpc.notifications.unreadCount.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (!currentFarm) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <div className="flex-1 p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto w-full space-y-6">

        {/* ── ZONE 1: HEADER ───────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500">Command Center Overview</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {systemHeaders.map(({ id, component: Widget }) => (
              <Widget key={id} farmId={farmId} />
            ))}

            <div className="flex items-center gap-3 border-l pl-4">
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-500 hover:text-slate-900">
                  <Bell className="w-5 h-5" />
                  {(notifCount?.count ?? 0) > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {notifCount?.count}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* ── ZONE 2: KPI ROW ──────────────────────────────────────────────── */}
        {kpis.length > 0 && (
          <section aria-label="Key Performance Indicators">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {kpis.map(({ id, component: Widget }) => (
                <Widget key={id} farmId={farmId} className="col-span-1 min-h-[140px] max-h-[180px]" />
              ))}
            </div>
          </section>
        )}

        {/* Intelligence widgets (e.g. Kili AI Insights) — always full width */}
        {intelligence.length > 0 && (
          <section aria-label="Intelligence">
            {intelligence.map(({ id, component: Widget }) => (
              <Widget key={id} farmId={farmId} />
            ))}
          </section>
        )}

        {/* ── ZONE 3: MAIN DYNAMIC GRID ────────────────────────────────────── */}
        <section aria-label="Dashboard Layout">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {mainGrid.map(({ id, size, component: Widget }) => (
              <Widget key={id} farmId={farmId} className={getSizeClasses(size)} />
            ))}

            <GlobalQuickActions farmId={farmId} className="col-span-1" />
          </div>
        </section>

      </div>
    </div>
  );
}
