import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function WaterQuality() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ unitId: 0, measurementDate: new Date().toISOString().slice(0, 16), pH: "", dissolvedOxygen: "", temperature: "", ammonia: "", notes: "" });

  const { data: records = [], isLoading } = trpc.aquaculture.listWaterQuality.useQuery({ farmId }, { enabled: !!farmId });
  const { data: units = [] } = trpc.aquaculture.listUnits.useQuery({ farmId }, { enabled: !!farmId });

  const createRecord = trpc.aquaculture.createWaterQuality.useMutation({
    onSuccess: () => { toast.success("Water quality recorded"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  const unitName = (id: number) => units.find((u: any) => u.id === id)?.identifier || `Unit ${id}`;

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Water Quality</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor pH, oxygen, temperature, and ammonia</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Record Reading</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No water quality readings yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recorded At</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">pH</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">DO (mg/L)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Temp (°C)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ammonia</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{formatDate(r.measurementDate)}</td>
                  <td className="px-4 py-3">{unitName(r.unitId)}</td>
                  <td className="px-4 py-3">{r.pH || "—"}</td>
                  <td className="px-4 py-3">{r.dissolvedOxygen || "—"}</td>
                  <td className="px-4 py-3">{r.temperature || "—"}</td>
                  <td className="px-4 py-3">{r.ammonia || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Water Quality</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createRecord.mutate({ farmId, ...form }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Production Unit *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.unitId} onChange={e => setForm({ ...form, unitId: parseInt(e.target.value) })} required>
                <option value={0} disabled>Select unit…</option>
                {units.map((u: any) => <option key={u.id} value={u.id}>{u.identifier}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Recorded At</Label>
              <Input type="datetime-local" value={form.measurementDate} onChange={e => setForm({ ...form, measurementDate: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>pH</Label>
                <Input value={form.pH} onChange={e => setForm({ ...form, pH: e.target.value })} placeholder="7.0" />
              </div>
              <div className="space-y-1.5">
                <Label>DO (mg/L)</Label>
                <Input value={form.dissolvedOxygen} onChange={e => setForm({ ...form, dissolvedOxygen: e.target.value })} placeholder="6.0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Temperature (°C)</Label>
                <Input value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} placeholder="25.0" />
              </div>
              <div className="space-y-1.5">
                <Label>Ammonia (mg/L)</Label>
                <Input value={form.ammonia} onChange={e => setForm({ ...form, ammonia: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createRecord.isPending}>Save Reading</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
