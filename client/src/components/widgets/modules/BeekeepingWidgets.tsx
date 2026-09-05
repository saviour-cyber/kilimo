import { trpc } from "@/lib/trpc";

export function BeekeepingKpiWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data: hives = [] } = trpc.beekeeping.listHives.useQuery(
    { farmId },
    { enabled: !!farmId }
  );
  const { data: apiaries = [] } = trpc.beekeeping.listApiaries.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const activeHives = hives.filter((h: any) => h.colonyStatus !== "dead" && h.colonyStatus !== "empty").length;

  return (
    <div className={`grid grid-cols-2 gap-3 ${className ?? ""}`}>
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">Active Hives</p>
        <p className="text-2xl font-bold text-foreground mt-1">{activeHives}</p>
      </div>
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">Apiaries</p>
        <p className="text-2xl font-bold text-foreground mt-1">{apiaries.length}</p>
      </div>
    </div>
  );
}
