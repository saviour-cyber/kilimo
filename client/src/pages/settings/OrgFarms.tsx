import { trpc } from "@/lib/trpc";
import { useFarm } from "@/contexts/FarmContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, Plus, MoreHorizontal, Pencil, Archive, ArrowRightLeft, Copy, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FARM_TYPE_LABELS: Record<string, string> = {
  crop: "Crop Farm", livestock: "Livestock Farm", mixed: "Mixed Farm",
  aquaculture: "Aquaculture Farm", poultry: "Poultry Farm", other: "Other",
};

const MODULE_LABELS: Record<string, string> = {
  crop: "Crop", livestock: "Livestock", inventory: "Inventory",
  finance: "Finance", weather: "Weather", disease: "Disease",
  iot: "IoT", reports: "Reports", dashboard: "Dashboard",
};

export default function OrgFarms() {
  const { currentFarm, switchFarm } = useFarm();
  const organizationId = currentFarm?.farm.organizationId ?? 0;

  const { data: farms = [], isLoading } = trpc.organizations.getFarms.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );

  if (isLoading) return (
    <div className="max-w-4xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Farms</h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Manage all farms under your organization. Each farm has its own modules, team, and settings.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Farm
        </Button>
      </div>

      {/* Farm List */}
      <div className="space-y-4">
        {(farms as any[]).map((farm: any) => {
          const isActive = currentFarm?.farm.id === farm.id;
          const farmTypeLabel = FARM_TYPE_LABELS[farm.farmType] ?? "Farm";
          const modules: string[] = farm.modules ?? [];

          return (
            <div
              key={farm.id}
              className={cn(
                "border rounded-2xl overflow-hidden transition-all",
                isActive ? "border-slate-900 shadow-sm" : "border-slate-200 hover:border-slate-300"
              )}
            >
              {/* Card Header */}
              <div className={cn("px-6 py-4 flex items-center justify-between", isActive ? "bg-slate-900" : "bg-slate-50")}>
                <div className="flex items-center gap-3">
                  {isActive && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className={cn("font-semibold text-base", isActive ? "text-white" : "text-slate-900")}>{farm.name}</h3>
                      {isActive && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className={cn("text-sm mt-0.5", isActive ? "text-slate-300" : "text-slate-500")}>{farmTypeLabel}</p>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={cn("w-8 h-8 p-0", isActive ? "text-slate-300 hover:text-white hover:bg-slate-700" : "")}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" /> Edit Farm
                    </DropdownMenuItem>
                    {!isActive && (
                      <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => switchFarm(farm.id)}>
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Switch to Farm
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                      <Copy className="w-3.5 h-3.5" /> Duplicate Farm
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer text-amber-600">
                      <Archive className="w-3.5 h-3.5" /> Archive Farm
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer text-red-600"
                      onClick={() => toast.error("Delete is disabled — archive the farm first.")}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete Farm
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4 flex items-start justify-between gap-6">
                <div className="space-y-3 flex-1">
                  {/* Modules */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Enabled Modules</p>
                    <div className="flex flex-wrap gap-1.5">
                      {modules.length > 0
                        ? modules.map(key => (
                          <Badge key={key} variant="secondary" className="text-xs font-medium capitalize">
                            {MODULE_LABELS[key] ?? key}
                          </Badge>
                        ))
                        : <span className="text-xs text-slate-400">No modules enabled</span>
                      }
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right space-y-1.5">
                  {farm.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 justify-end">
                      <MapPin className="w-3.5 h-3.5" />
                      {farm.location}
                    </div>
                  )}
                  {farm.sizeHectares && (
                    <p className="text-xs text-slate-500">{farm.sizeHectares} ha</p>
                  )}
                  {!isActive && (
                    <Button variant="outline" size="sm" className="text-xs h-7 mt-2" onClick={() => switchFarm(farm.id)}>
                      <ArrowRightLeft className="w-3 h-3 mr-1" /> Switch
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {farms.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
            <MapPin className="w-10 h-10 text-slate-300 mb-4" />
            <p className="text-sm font-medium text-slate-700">No farms yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Create your first farm to get started.</p>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add First Farm</Button>
          </div>
        )}
      </div>
    </div>
  );
}
