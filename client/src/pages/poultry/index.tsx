import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Bird } from "lucide-react";

export default function PoultryOverview() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const { data: flocks = [] } = trpc.poultry.listFlocks.useQuery({ farmId }, { enabled: !!farmId });
  const { data: eggs = [] } = trpc.poultry.listEggProduction.useQuery({ farmId }, { enabled: !!farmId });
  const { data: mortality = [] } = trpc.poultry.listMortality.useQuery({ farmId }, { enabled: !!farmId });

  const activeFlocks = flocks.filter((f: any) => f.status === "active").length;
  const totalBirds = flocks.filter((f: any) => f.status === "active").reduce((s: number, f: any) => s + (f.quantity ?? 0), 0);
  const recentEggs = eggs.slice(0, 7).reduce((s: number, r: any) => s + (r.eggsCollected ?? 0), 0);
  const recentMortality = mortality.slice(0, 7).reduce((s: number, r: any) => s + (r.quantity ?? 0), 0);

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Poultry</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Flock and egg production overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Flocks", value: activeFlocks },
          { label: "Total Birds", value: totalBirds.toLocaleString() },
          { label: "Eggs (7 days)", value: recentEggs.toLocaleString() },
          { label: "Mortality (7 days)", value: recentMortality },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
        ))}
      </div>

      {flocks.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <Bird className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-foreground">No flocks registered</p>
          <p className="text-sm text-muted-foreground mt-1">Go to Flocks to register your first flock.</p>
        </div>
      )}

      {flocks.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Flocks</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Quantity</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {flocks.slice(0, 5).map((f: any) => (
                  <tr key={f.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{f.name}</td>
                    <td className="px-4 py-3 capitalize">{f.birdType}</td>
                    <td className="px-4 py-3">{f.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${f.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{f.status}</span>
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
