import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Fish } from "lucide-react";

export default function AquacultureOverview() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const { data: units = [] } = trpc.aquaculture.listUnits.useQuery({ farmId }, { enabled: !!farmId });
  const { data: stocking = [] } = trpc.aquaculture.listStocking.useQuery({ farmId }, { enabled: !!farmId });
  const { data: harvests = [] } = trpc.aquaculture.listHarvests.useQuery({ farmId }, { enabled: !!farmId });
  const { data: mortality = [] } = trpc.aquaculture.listMortality.useQuery({ farmId }, { enabled: !!farmId });

  const activeUnits = units.filter((u: any) => u.status === "active").length;
  const recentHarvestKg = harvests.slice(0, 10).reduce((s: number, h: any) => s + parseFloat(h.quantityKg ?? "0"), 0);
  const recentMortality = mortality.slice(0, 30).reduce((s: number, m: any) => s + (m.quantity ?? 0), 0);

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Aquaculture</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fish farming and water management overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Units", value: activeUnits },
          { label: "Total Units", value: units.length },
          { label: "Recent Harvest (kg)", value: recentHarvestKg.toFixed(1) },
          { label: "Recent Mortality", value: recentMortality },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
        ))}
      </div>

      {units.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <Fish className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-foreground">No production units registered</p>
          <p className="text-sm text-muted-foreground mt-1">Go to Production Units to set up ponds, tanks, or cages.</p>
        </div>
      )}

      {units.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Production Units</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Capacity (kg)</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {units.slice(0, 5).map((u: any) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 capitalize">{u.unitType}</td>
                    <td className="px-4 py-3">{u.capacityKg || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${u.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
