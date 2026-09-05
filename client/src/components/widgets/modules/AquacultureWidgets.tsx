import { trpc } from "@/lib/trpc";

export function AquacultureKpiWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data: units = [] } = trpc.aquaculture.listUnits.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const activeUnits = units.filter((u: any) => u.status === "active").length;

  return (
    <div className={`grid grid-cols-2 gap-3 ${className ?? ""}`}>
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">Active Units</p>
        <p className="text-2xl font-bold text-foreground mt-1">{activeUnits}</p>
      </div>
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">Total Units</p>
        <p className="text-2xl font-bold text-foreground mt-1">{units.length}</p>
      </div>
    </div>
  );
}
