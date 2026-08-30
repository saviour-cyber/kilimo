import { Beef, PlusCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function LivestockKpiWidget({ farmId }: { farmId: number }) {
  const { data, isLoading } = trpc.livestock.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className="h-[100px] rounded-2xl" />;

  const activeAnimals = data?.activeAnimals ?? 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col h-[100px]">
      <span className="text-[11px] font-semibold text-amber-600 truncate mb-1">Animals</span>
      <span className="text-[15px] font-bold text-slate-900 truncate flex-1">{activeAnimals}</span>
      <Beef className="w-4 h-4 text-amber-500" />
    </div>
  );
}

export function LivestockSummaryWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.livestock.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[250px] rounded-xl w-full", className)} />;

  const totalAnimals = data?.totalAnimals ?? 0;
  const sickAnimals = data?.recentMortality ?? 0;
  const recentHealthLogs = data?.recentHealthLogs ?? [];
  const speciesBreakdown = data?.speciesBreakdown ?? [];
  
  const pregnantCount = speciesBreakdown.find(s => s.species === "cattle")?.count ?? 0;

  return (
    <Card className={cn("border shadow-sm bg-white flex flex-col", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-amber-100">
            <Beef className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <span className="font-bold text-[13px] text-foreground">Livestock Overview</span>
        </div>
        <Link href="/livestock">
          <span className="text-[11px] font-bold text-muted-foreground hover:text-amber-600 cursor-pointer">View All</span>
        </Link>
      </div>
      
      <CardContent className="p-4 flex flex-col gap-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-2.5 border border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Head</div>
            <div className="text-lg font-bold text-foreground leading-none">{totalAnimals}</div>
          </div>
          <div className="bg-muted rounded-lg p-2.5 border border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pregnant</div>
            <div className="text-lg font-bold text-foreground leading-none">{pregnantCount}</div>
          </div>
        </div>

        {/* Alerts List */}
        {sickAnimals > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-medium text-red-700 bg-red-50 p-1.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {sickAnimals} animal{sickAnimals > 1 ? "s" : ""} require medical attention
            </div>
          </div>
        )}

        {/* Embedded Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Link href="/livestock/animals">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-md hover:bg-amber-100 transition-colors">
              <Beef className="w-3 h-3" /> Register Animal
            </button>
          </Link>
          <Link href="/livestock/health">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-orange-50 text-orange-700 text-[11px] font-bold rounded-md hover:bg-orange-100 transition-colors">
              <PlusCircle className="w-3 h-3" /> Log Health
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
