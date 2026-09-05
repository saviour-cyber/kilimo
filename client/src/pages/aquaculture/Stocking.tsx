import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Stocking() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ unitId: 0, stockingDate: new Date().toISOString().slice(0, 10), species: "", quantity: "", initialWeightG: "", source: "", notes: "" });

  const { data: records = [], isLoading } = trpc.aquaculture.listStocking.useQuery({ farmId }, { enabled: !!farmId });
  const { data: units = [] } = trpc.aquaculture.listUnits.useQuery({ farmId }, { enabled: !!farmId });

  const createRecord = trpc.aquaculture.createStocking.useMutation({
    onSuccess: () => { toast.success("Stocking record saved"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  const unitName = (id: number) => units.find((u: any) => u.id === id)?.identifier || `Unit ${id}`;

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stocking Records</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Fish stocking events</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Add Stocking</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No stocking records yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Species</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Quantity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Avg. Weight (g)</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{r.stockingDate}</td>
                  <td className="px-4 py-3">{unitName(r.unitId)}</td>
                  <td className="px-4 py-3">{r.species}</td>
                  <td className="px-4 py-3">{r.quantity?.toLocaleString()}</td>
                  <td className="px-4 py-3">{r.initialWeightG || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stocking Record</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createRecord.mutate({ farmId, ...form, quantity: parseInt(form.quantity) || 0 }); }} className="space-y-4">
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
                <Input type="date" value={form.stockingDate} onChange={e => setForm({ ...form, stockingDate: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Species *</Label>
                <Input value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} placeholder="e.g. Tilapia" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Avg. Weight (g)</Label>
                <Input value={form.initialWeightG} onChange={e => setForm({ ...form, initialWeightG: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Supplier / Hatchery" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createRecord.isPending}>Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
