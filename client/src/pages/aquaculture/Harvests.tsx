import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AquacultureHarvests() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ unitId: 0, harvestDate: new Date().toISOString().slice(0, 10), species: "", totalWeightKg: "", quantity: 0, averageWeightG: "", notes: "" });

  const { data: harvests = [], isLoading } = trpc.aquaculture.listHarvests.useQuery({ farmId }, { enabled: !!farmId });
  const { data: units = [] } = trpc.aquaculture.listUnits.useQuery({ farmId }, { enabled: !!farmId });

  const createHarvest = trpc.aquaculture.createHarvest.useMutation({
    onSuccess: () => { toast.success("Harvest recorded"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  const unitName = (id: number) => units.find((u: any) => u.id === id)?.identifier || `Unit ${id}`;

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Harvests</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Fish harvest records</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Record Harvest</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : harvests.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No harvest records yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Species</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qty (kg)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Count</th>
              </tr>
            </thead>
            <tbody>
              {harvests.map((h: any) => (
                <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{h.harvestDate}</td>
                  <td className="px-4 py-3">{unitName(h.unitId)}</td>
                  <td className="px-4 py-3">{h.species || "—"}</td>
                  <td className="px-4 py-3 font-medium">{h.totalWeightKg || "—"}</td>
                  <td className="px-4 py-3">{h.quantity || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Harvest</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createHarvest.mutate({ farmId, ...form }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Production Unit *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.unitId} onChange={e => setForm({ ...form, unitId: parseInt(e.target.value) })} required>
                <option value={0} disabled>Select unit…</option>
                {units.map((u: any) => <option key={u.id} value={u.id}>{u.identifier}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.harvestDate} onChange={e => setForm({ ...form, harvestDate: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Species</Label>
                <Input value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Qty (kg)</Label>
                <Input value={form.totalWeightKg} onChange={e => setForm({ ...form, totalWeightKg: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Count</Label>
                <Input type="number" min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Avg. Wt (g)</Label>
                <Input value={form.averageWeightG} onChange={e => setForm({ ...form, averageWeightG: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createHarvest.isPending}>Record Harvest</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
