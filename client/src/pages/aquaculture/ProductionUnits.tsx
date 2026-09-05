import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ProductionUnits() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ identifier: "", unitType: "pond" as "pond" | "tank" | "cage" | "raceway", capacityLiters: "", location: "", notes: "" });

  const { data: units = [], isLoading } = trpc.aquaculture.listUnits.useQuery({ farmId }, { enabled: !!farmId });

  const createUnit = trpc.aquaculture.createUnit.useMutation({
    onSuccess: () => { toast.success("Production unit created"); setOpen(false); setForm({ identifier: "", unitType: "pond", capacityLiters: "", location: "", notes: "" }); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Production Units</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Ponds, tanks, cages, and raceways</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Add Unit</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : units.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No production units yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Identifier</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Capacity (L)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u: any) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{u.identifier}</td>
                  <td className="px-4 py-3 capitalize">{u.unitType}</td>
                  <td className="px-4 py-3">{u.capacityLiters || "—"}</td>
                  <td className="px-4 py-3">{u.location || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${u.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Production Unit</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createUnit.mutate({ farmId, ...form }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Identifier *</Label>
              <Input value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} placeholder="e.g. Pond A" required />
            </div>
            <div className="space-y-1.5">
              <Label>Unit Type</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.unitType} onChange={e => setForm({ ...form, unitType: e.target.value as any })}>
                <option value="pond">Pond</option>
                <option value="tank">Tank</option>
                <option value="cage">Cage</option>
                <option value="raceway">Raceway</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Capacity (Liters)</Label>
                <Input value={form.capacityLiters} onChange={e => setForm({ ...form, capacityLiters: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="North Sector" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createUnit.isPending}>Create Unit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
