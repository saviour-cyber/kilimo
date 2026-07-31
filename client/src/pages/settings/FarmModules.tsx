import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Category metadata for each module key
const MODULE_CATEGORY: Record<string, { label: string; color: string }> = {
  dashboard:  { label: "Core",             color: "bg-slate-100 text-slate-600" },
  crop:       { label: "Business Module",  color: "bg-green-50 text-green-700" },
  livestock:  { label: "Business Module",  color: "bg-amber-50 text-amber-700" },
  inventory:  { label: "Business Module",  color: "bg-blue-50 text-blue-700" },
  finance:    { label: "Business Module",  color: "bg-purple-50 text-purple-700" },
  disease:    { label: "AI Service",       color: "bg-red-50 text-red-700" },
  weather:    { label: "Platform Service", color: "bg-cyan-50 text-cyan-700" },
  iot:        { label: "Platform Service", color: "bg-orange-50 text-orange-700" },
  reports:    { label: "Platform Service", color: "bg-indigo-50 text-indigo-700" },
};

export default function FarmModules() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const utils = trpc.useUtils();

  const { data: moduleData = [], isLoading } = trpc.farms.getModules.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const enabledModules: string[] = (moduleData as any[])
    .filter((m: any) => m.isEnabled)
    .map((m: any) => m.moduleKey);

  const toggleModule = trpc.farms.toggleModule.useMutation({
    onSuccess: () => { utils.farms.getModules.invalidate(); toast.success("Module updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  const displayModules = MODULE_REGISTRY.filter(m => m.key !== "dashboard");

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Farm Modules</h2>
        <p className="text-sm text-slate-500 mt-1.5">
          Enable or disable features for <span className="font-medium text-slate-700">{currentFarm?.farm.name}</span>. Changes affect navigation for all team members on this farm.
        </p>
      </div>

      {/* Module List */}
      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
        {displayModules.map((mod: any) => {
          const isEnabled = enabledModules.includes(mod.key);
          const catMeta = MODULE_CATEGORY[mod.key] ?? { label: "Module", color: "bg-slate-50 text-slate-600" };

          return (
            <div
              key={mod.key}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors",
                isEnabled ? "bg-white" : "bg-slate-50/30"
              )}
            >
              {/* Icon */}
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", mod.bgColor ?? "bg-slate-100")}>
                <mod.icon className={cn("w-5 h-5", mod.iconColor ?? "text-slate-500")} />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-900">{mod.label}</p>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-transparent", catMeta.color)}>
                    {catMeta.label}
                  </span>
                  {isEnabled && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Enabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{mod.description}</p>
              </div>

              {/* Toggle */}
              <div className="shrink-0">
                <Switch
                  checked={isEnabled}
                  disabled={!can("manage") || toggleModule.isPending}
                  onCheckedChange={(checked) => toggleModule.mutate({ farmId, moduleKey: mod.key, isEnabled: checked })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Only Farm Managers and Administrators can enable or disable modules. The Dashboard is always active.
      </p>
    </div>
  );
}
