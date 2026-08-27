import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";
import { useGrantedModules } from "@/hooks/useEntitlement";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Category metadata for each module key
const MODULE_CATEGORY: Record<string, { label: string; color: string }> = {
  dashboard:  { label: "Core",             color: "bg-muted text-muted-foreground" },
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

  const { modules: grantedModules, isLoading: grantedLoading } = useGrantedModules();
  
  const { data: moduleData = [], isLoading: modulesLoading } = trpc.farms.getModules.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const explicitlyDisabled = (moduleData as any[])
    .filter((m: any) => !m.isEnabled)
    .map((m: any) => m.moduleKey);
    
  const enabledModules = grantedModules.filter((key) => !explicitlyDisabled.includes(key));

  const toggleModule = trpc.farms.toggleModule.useMutation({
    onSuccess: () => { utils.farms.getModules.invalidate(); toast.success("Module updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (modulesLoading || grantedLoading) return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  const displayModules = MODULE_REGISTRY.filter(m => m.key !== "dashboard");

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">Configure Farm Modules</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Enable or disable features for <span className="font-medium text-muted-foreground">{currentFarm?.farm.name}</span>. Changes affect navigation for all team members on this farm.
        </p>
      </div>

      {/* Module List */}
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-slate-100">
        {displayModules.map((mod: any) => {
          const isIncluded = grantedModules.includes(mod.key);
          const isEnabled = enabledModules.includes(mod.key);
          const catMeta = MODULE_CATEGORY[mod.key] ?? { label: "Module", color: "bg-muted text-muted-foreground" };

          return (
            <div
              key={mod.key}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors",
                isEnabled && isIncluded ? "bg-white" : "bg-muted/30"
              )}
            >
              {/* Icon */}
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", mod.bgColor ?? "bg-muted")}>
                <mod.icon className={cn("w-5 h-5", mod.iconColor ?? "text-muted-foreground")} />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{mod.label}</p>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-transparent", catMeta.color)}>
                    {catMeta.label}
                  </span>
                  {isIncluded ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      âœ“ Included in Plan
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                      âœ— Not in Plan
                    </span>
                  )}
                  {isEnabled && isIncluded ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      âœ“ Active
                    </span>
                  ) : isIncluded ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      â—‹ Not Active
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{mod.description}</p>
                {!isIncluded && (
                  <p className="text-xs text-rose-500 font-medium mt-1">Upgrade your subscription to unlock this module.</p>
                )}
              </div>

              {/* Toggle */}
              <div className="shrink-0">
                <Switch
                  checked={isEnabled && isIncluded}
                  disabled={!can("manage") || toggleModule.isPending || !isIncluded}
                  onCheckedChange={(checked) => toggleModule.mutate({ farmId, moduleKey: mod.key, isEnabled: checked })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Only Farm Managers and Administrators can enable or disable modules. The Dashboard is always active.
      </p>
    </div>
  );
}
