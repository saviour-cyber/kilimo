import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Milk } from "lucide-react";

export default function DairyOverview() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const { data: animals = [] } = trpc.dairy.listAnimals.useQuery({ farmId }, { enabled: !!farmId });
  const { data: milkRecords = [] } = trpc.dairy.listMilkProduction.useQuery({ farmId }, { enabled: !!farmId });

  const active = animals.filter((a: any) => a.status === "active").length;
  const recentMilk = milkRecords.slice(0, 7).reduce((s: number, r: any) => s + parseFloat(r.totalVolume ?? "0"), 0);

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dairy</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Herd and milk production overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Active Animals", value: active },
          { label: "Total Registered", value: animals.length },
          { label: "Milk (7 days, L)", value: recentMilk.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
        ))}
      </div>

      {animals.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <Milk className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-foreground">No animals registered</p>
          <p className="text-sm text-muted-foreground mt-1">Go to Animals to register your dairy herd.</p>
        </div>
      )}

      {animals.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Animals</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name / Tag</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Breed</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Gender</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {animals.slice(0, 5).map((a: any) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{a.name || a.tagNumber || `Animal #${a.id}`}</td>
                    <td className="px-4 py-3">{a.breed || "—"}</td>
                    <td className="px-4 py-3 capitalize">{a.gender}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${a.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{a.status}</span>
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
