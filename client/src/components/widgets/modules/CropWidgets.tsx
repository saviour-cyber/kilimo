import { Card, CardContent } from "@/components/ui/card";
import { Sprout, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function CropKpiWidget({ farmId }: { farmId: number }) {
  const { data, isLoading } = trpc.crops.dashboardSummary.useQuery({ farmId }, { enabled: !!farmId });
  if (isLoading) return <Skeleton className="h-[100px] rounded-2xl" />;
  const activeCrops = data?.activeCrops ?? 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col h-[100px]">
      <span className="text-[11px] font-semibold text-green-600 truncate mb-1">Active Crops</span>
      <span className="text-[15px] font-bold text-slate-900 truncate flex-1">{activeCrops}</span>
      <Sprout className="w-4 h-4 text-green-500" />
    </div>
  );
}

export function CropSummaryWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.crops.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[250px] rounded-xl w-full", className)} />;

  const activeCrops = data?.activeCrops ?? 0;
  const fields = data?.totalFields ?? 0;
  const harvestsDue = data?.recentHarvests?.length ?? 0;
  const incidents = data?.activeIncidents ?? 0;
  const recentActivity = data?.recentHarvests ?? [];

  return (
    <Card className={cn("border shadow-sm bg-white flex flex-col", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-green-100">
            <Sprout className="w-3.5 h-3.5 text-green-700" />
          </div>
          <span className="font-bold text-[13px] text-foreground">Crops Overview</span>
        </div>
        <Link href="/crops">
          <span className="text-[11px] font-bold text-muted-foreground hover:text-green-600 cursor-pointer">View All</span>
        </Link>
      </div>
      
      <CardContent className="p-4 flex flex-col gap-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-2.5 border border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Crops</div>
            <div className="text-lg font-bold text-foreground leading-none">{activeCrops}</div>
          </div>
          <div className="bg-muted rounded-lg p-2.5 border border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Fields</div>
            <div className="text-lg font-bold text-foreground leading-none">{fields}</div>
          </div>
        </div>

        {/* Alerts List */}
        {(incidents > 0 || harvestsDue > 0) && (
          <div className="space-y-1.5">
            {incidents > 0 && (
              <div className="flex items-center gap-2 text-[11px] font-medium text-amber-700 bg-amber-50 p-1.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {incidents} active incident{incidents > 1 ? "s" : ""} reported
              </div>
            )}
            {harvestsDue > 0 && (
              <div className="flex items-center gap-2 text-[11px] font-medium text-blue-700 bg-blue-50 p-1.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                {harvestsDue} harvest{harvestsDue > 1 ? "s" : ""} due this week
              </div>
            )}
          </div>
        )}

        {/* Embedded Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Link href="/crops/plantings">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-green-50 text-green-700 text-[11px] font-bold rounded-md hover:bg-green-100 transition-colors">
              <Sprout className="w-3 h-3" /> Add Crop
            </button>
          </Link>
          <Link href="/crops/fields">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md hover:bg-emerald-100 transition-colors">
              <BarChart3 className="w-3 h-3" /> Manage Fields
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
