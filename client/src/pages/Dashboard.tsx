import { useFarm } from "@/contexts/FarmContext";
import { useGrantedModules } from "@/hooks/useEntitlement";
import { useAuth } from "@/_core/hooks/useAuth";
import { MODULE_REGISTRY, getAllWidgets } from "@/lib/moduleRegistry";
import { format } from "date-fns";
import { Bell } from "lucide-react";
import { Link } from "wouter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import React from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { currentFarm } = useFarm();
  const { modules } = useGrantedModules();
  const { user } = useAuth();

  // Get first name from the authenticated user's full name
  const firstName = user?.name?.split(" ")[0] ?? "";
  const greeting = getGreeting();

  if (!currentFarm) return null;

  const allWidgets = getAllWidgets(modules);
  const activeModules = MODULE_REGISTRY.filter(m => m.alwaysVisible || modules.includes(m.key));
  const quickActions = activeModules.flatMap(m => m.quickActions ?? []);

  // Filter out KPI widgets (they go in "Your Summary" at the bottom)
  const nonKpiWidgets = Object.entries(allWidgets)
    .filter(([type]) => type !== "kpi")
    .flatMap(([_, widgets]) => widgets)
    .sort((a, b) => {
      const levelWeight = { critical: 0, high: 1, normal: 2, low: 3 };
      const weightA = levelWeight[a.priority.level];
      const weightB = levelWeight[b.priority.level];
      if (weightA !== weightB) return weightA - weightB;
      return a.priority.order - b.priority.order;
    });

  const kpiWidgets = allWidgets.kpi.sort((a, b) => a.priority.order - b.priority.order);

  // Subtitle: date · farm name · location (only show location if it exists)
  const farmLocation = currentFarm.farm.location;
  const subtitle = [
    format(new Date(), "EEEE, d MMMM"),
    currentFarm.farm.name,
    farmLocation || null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="flex-1 pb-20 w-full bg-background min-h-screen">
      
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {greeting}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-card border flex items-center justify-center relative shadow-sm hover:bg-accent transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      {quickActions.length > 0 && (
        <div className="mb-8">
          <div className="px-5 flex justify-between items-end mb-4">
            <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
            <Link href="/modules"><span className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">View All ›</span></Link>
          </div>
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex w-max space-x-3 px-5">
              {quickActions.map((action, idx) => (
                <Link key={idx} href={action.path}>
                  <div className="flex flex-col items-center justify-center w-[72px] cursor-pointer group">
                    <div className="w-16 h-16 rounded-xl bg-card border shadow-sm flex items-center justify-center mb-2 group-hover:-translate-y-0.5 transition-transform">
                      <action.icon className={`w-6 h-6 ${action.color.replace('bg-', 'text-').split(' ')[1] || 'text-muted-foreground'}`} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground truncate w-full text-center transition-colors">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      )}

      {/* DYNAMIC MODULE WIDGETS */}
      <div className="space-y-8 px-5">
        {nonKpiWidgets.map(widget => (
          <React.Fragment key={widget.id}>
            <widget.component farmId={currentFarm.farm.id} />
          </React.Fragment>
        ))}

        {/* YOUR SUMMARY (KPIs) */}
        {kpiWidgets.length > 0 && (
          <div className="pt-2">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-base font-semibold text-foreground">Your Summary</h2>
              <Link href="/reports"><span className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">View All ›</span></Link>
            </div>
            {/* auto-fill: min 140px per card, max 1fr — fills row cleanly */}
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              {kpiWidgets.map(widget => (
                <React.Fragment key={widget.id}>
                  <widget.component farmId={currentFarm.farm.id} />
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}