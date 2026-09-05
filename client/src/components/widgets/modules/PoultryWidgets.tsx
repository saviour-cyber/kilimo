import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";

export function PoultryKpiWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data: flocks = [] } = trpc.poultry.listFlocks.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const activeFlocks = flocks.filter((f: any) => f.status === "active").length;
  const totalBirds = flocks
    .filter((f: any) => f.status === "active")
    .reduce((sum: number, f: any) => sum + (f.quantity ?? 0), 0);

  return (
    <div className={`grid grid-cols-2 gap-3 ${className ?? ""}`}>
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">Active Flocks</p>
        <p className="text-2xl font-bold text-foreground mt-1">{activeFlocks}</p>
      </div>
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">Total Birds</p>
        <p className="text-2xl font-bold text-foreground mt-1">{totalBirds.toLocaleString()}</p>
      </div>
    </div>
  );
}
