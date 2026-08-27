import { useFarm } from "@/contexts/FarmContext";
import { getAllWidgets, getQuickActions, type DashboardWidgetDefinition } from "@/lib/moduleRegistry";
import { getAllServiceWidgets } from "@/lib/serviceRegistry";
import { trpc } from "@/lib/trpc";
import { useGrantedModules } from "@/hooks/useEntitlement";
import { Link } from "wouter";
import { Bell, Sun, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ????????? Priorities & Sorting ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const priorityValue = { critical: 4, high: 3, normal: 2, low: 1 };
function sortWidgets(a: DashboardWidgetDefinition, b: DashboardWidgetDefinition) {
  const pA = priorityValue[a.priority.level];
  const pB = priorityValue[b.priority.level];
  if (pA !== pB) return pB - pA;
  return a.priority.order - b.priority.order;
}

// ????????? Sizing Helper ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
function getSizeClasses(size: string) {
  switch (size) {
    case "small": return "col-span-1";
    case "medium": return "col-span-1"; 
    case "large": return "col-span-1 md:col-span-2 lg:col-span-3";
    default: return "col-span-1";
  }
}

// ????????? Main Layout Engine ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
export default function Dashboard() {
  const { currentFarm, enabledModules } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const { modules: grantedModules } = useGrantedModules();
  const effectiveModules = enabledModules.filter(m => grantedModules.includes(m));

  // 1. Collect all raw widgets
  const moduleWidgets = getAllWidgets(effectiveModules);
  const serviceWidgets = getAllServiceWidgets();
  const allWidgets = [...Object.values(moduleWidgets).flat(), ...Object.values(serviceWidgets).flat()];

  // 2. Group & Sort by priority
  const kpis = allWidgets.filter((w) => w.type === "kpi").sort(sortWidgets);
  const intelligence = allWidgets.filter((w) => w.type === "intelligence").sort(sortWidgets);
  const mainGrid = allWidgets.filter((w) => ["summary", "activity", "utility", "system"].includes(w.type) && w.size !== "small").sort(sortWidgets);

  const actions = getQuickActions(effectiveModules);
  const { data: user } = trpc.users.me.useQuery();

  const greeting = user?.name ? `Habari, ${user.name.split(" ")[0]}` : "Habari";
  const dateStr = format(new Date(), "EEEE, d MMMM");
  const farmName = currentFarm?.farm.name ?? "Farm";
  const location = currentFarm?.farm.location ?? "Kenya";

  if (!currentFarm) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 pb-28 max-w-7xl mx-auto w-full space-y-6">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <span>{dateStr}</span>
            <span>???</span>
            <span className="font-medium text-foreground/80">{farmName}</span>
            <span>???</span>
            <span>{location}</span>
          </p>
        </div>
        
        {/* Weather summary pill (mocked or real if available) */}
        <Link href="/weather">
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm hover:shadow cursor-pointer transition-all">
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">22??</span>
            <span className="text-sm text-muted-foreground">Clear</span>
            <span className="text-muted-foreground">???</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><CloudRain className="w-3 h-3"/> rain Sun</span>
          </div>
        </Link>
      </header>

      {/* Quick Actions (Horizontal Pills) */}
      {actions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {actions.map((action, i) => (
            <Link key={action.path + action.label} href={action.path}>
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shadow-sm border",
                  i === 0 
                    ? "bg-[#EAB308] text-black border-[#EAB308] hover:bg-[#CA8A04]" // Primary amber button
                    : "bg-card text-foreground border-border hover:bg-accent" // Secondary white pills
                )}
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                {action.label}
              </button>
            </Link>
          ))}
        </div>
      )}

      {/* KPI Row */}
      {kpis.length > 0 && (
        <section aria-label="Key Performance Indicators">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map(({ id, component: Widget }) => (
              <Widget key={id} farmId={farmId} className="col-span-1 min-h-[140px] max-h-[180px] bg-card border-none shadow-sm rounded-2xl" />
            ))}
          </div>
        </section>
      )}

      {/* Intelligence (e.g. Kili AI Insights) */}
      {intelligence.length > 0 && (
        <section aria-label="Intelligence">
          {intelligence.map(({ id, component: Widget }) => (
            <Widget key={id} farmId={farmId} />
          ))}
        </section>
      )}

      {/* Main Dynamic Grid */}
      <section aria-label="Dashboard Layout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mainGrid.map(({ id, size, component: Widget }) => (
            <Widget key={id} farmId={farmId} className={cn(getSizeClasses(size), "bg-card border-none shadow-sm rounded-2xl")} />
          ))}
        </div>
      </section>
    </div>
  );
}