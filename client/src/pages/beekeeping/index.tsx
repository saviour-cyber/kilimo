import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Flower2 } from "lucide-react";

export default function BeekeepingOverview() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const { data: apiaries = [] } = trpc.beekeeping.listApiaries.useQuery({ farmId }, { enabled: !!farmId });
  const { data: hives = [] } = trpc.beekeeping.listHives.useQuery({ farmId }, { enabled: !!farmId });
  const { data: harvests = [] } = trpc.beekeeping.listHarvests.useQuery({ farmId }, { enabled: !!farmId });

  const activeHives = hives.filter((h: any) => h.colonyStatus !== "dead" && h.colonyStatus !== "empty").length;
  const totalHarvestKg = harvests.slice(0, 10).reduce((s: number, h: any) => s + parseFloat(h.quantityKg ?? "0"), 0);

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Beekeeping</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Apiary and honey production overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Apiaries", value: apiaries.length },
          { label: "Total Hives", value: hives.length },
          { label: "Active Hives", value: activeHives },
          { label: "Recent Harvest (kg)", value: totalHarvestKg.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
        ))}
      </div>

      {apiaries.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <Flower2 className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-foreground">No apiaries registered</p>
          <p className="text-sm text-muted-foreground mt-1">Go to Apiaries to set up your first apiary.</p>
        </div>
      )}

      {apiaries.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Apiaries</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {apiaries.map((a: any) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3">{a.location || "—"}</td>
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
