import { useFarm } from "@/contexts/FarmContext";
import { useGrantedModules } from "@/hooks/useEntitlement";
import { MODULE_REGISTRY, getAllWidgets } from "@/lib/moduleRegistry";
import { format } from "date-fns";
import { Bell, MapPin, Search } from "lucide-react";
import { Link } from "wouter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import React from "react";

export default function Dashboard() {
  const { currentFarm } = useFarm();
  const { modules } = useGrantedModules();
  
  // Example user name (in real app, get from auth context)
  const userName = "Davis"; 

  if (!currentFarm) return null;

  const allWidgets = getAllWidgets(modules);
  const activeModules = MODULE_REGISTRY.filter(m => m.alwaysVisible || modules.includes(m.key));
  const quickActions = activeModules.flatMap(m => m.quickActions ?? []);

  // Filter out KPI widgets (they go in "Your Summary" at the bottom)
  const nonKpiWidgets = Object.entries(allWidgets)
    .filter(([type]) => type !== "kpi")
    .flatMap(([_, widgets]) => widgets)
    .sort((a, b) => {
      // Sort by priority level first, then order
      const levelWeight = { critical: 0, high: 1, normal: 2, low: 3 };
      const weightA = levelWeight[a.priority.level];
      const weightB = levelWeight[b.priority.level];
      if (weightA !== weightB) return weightA - weightB;
      return a.priority.order - b.priority.order;
    });

  const kpiWidgets = allWidgets.kpi.sort((a, b) => a.priority.order - b.priority.order);

  return (
    <div className="flex-1 pb-28 w-full bg-[#FDFCF5] min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900">
              Habari, {userName} 👋
            </h1>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">
              {format(new Date(), "EEEE, d MMMM")} · {currentFarm.farm.name} · {currentFarm.farm.location || "Nyeri County"}
            </p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center relative shadow-sm">
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* WEATHER WIDGET (Hardcoded for now as it's a core system widget, or could be a system widget) */}
        <div className="mt-4 inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-slate-100 shadow-sm">
          <span className="text-lg">☀️</span>
          <span className="font-bold text-slate-800">18°</span>
          <span className="text-sm text-slate-500 font-medium border-l pl-2 ml-1">Clear · Rain on Sun</span>
          <span className="text-slate-400 ml-1 text-lg leading-none">›</span>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      {quickActions.length > 0 && (
        <div className="mb-8">
          <div className="px-5 flex justify-between items-end mb-4">
            <h2 className="text-[17px] font-bold text-slate-900">Quick Actions</h2>
            <Link href="/modules"><span className="text-[13px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer">View All ›</span></Link>
          </div>
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex w-max space-x-3 px-5">
              {quickActions.map((action, idx) => (
                <Link key={idx} href={action.path}>
                  <div className="flex flex-col items-center justify-center w-[72px] cursor-pointer group">
                    <div className="w-[72px] h-[72px] rounded-[20px] bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-2 group-hover:scale-95 transition-transform">
                      <action.icon className={`w-7 h-7 ${action.color.replace('bg-', 'text-').split(' ')[1] || 'text-slate-700'}`} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 truncate w-full text-center">{action.label}</span>
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
              <h2 className="text-[17px] font-bold text-slate-900">Your Summary</h2>
              <Link href="/reports"><span className="text-[13px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer">View All ›</span></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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