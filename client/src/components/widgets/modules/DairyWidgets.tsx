import { trpc } from "@/lib/trpc";

export function DairyKpiWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data: animals = [] } = trpc.dairy.listAnimals.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const activeAnimals = animals.filter((a: any) => a.status === "active").length;

  return (
    <div className={`grid grid-cols-2 gap-3 ${className ?? ""}`}>
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">Active Animals</p>
        <p className="text-2xl font-bold text-foreground mt-1">{activeAnimals}</p>
      </div>
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">Total Registered</p>
        <p className="text-2xl font-bold text-foreground mt-1">{animals.length}</p>
      </div>
    </div>
  );
}
