import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function GrowthLogs() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ unitId: 0, logDate: new Date().toISOString().slice(0, 10), sampleSize: 0, averageWeightG: "", notes: "" });

  const { data: logs = [], isLoading } = trpc.aquaculture.listGrowthLogs.useQuery({ farmId }, { enabled: !!farmId });
  const { data: units = [] } = trpc.aquaculture.listUnits.useQuery({ farmId }, { enabled: !!farmId });

  const createLog = trpc.aquaculture.createGrowthLog.useMutation({
    onSuccess: () => { toast.success("Growth log saved"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  const unitName = (id: number) => units.find((u: any) => u.id === id)?.identifier || `Unit ${id}`;

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Growth Logs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track fish weight and length over time</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Log Growth</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : logs.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No growth logs yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sample Size</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Avg. Weight (g)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{l.logDate}</td>
                  <td className="px-4 py-3">{unitName(l.unitId)}</td>
                  <td className="px-4 py-3">{l.sampleSize || "—"}</td>
                  <td className="px-4 py-3 font-medium">{l.averageWeightG || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Growth Sample</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createLog.mutate({ farmId, ...form }); }} className="space-y-4">
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
                <Input type="date" value={form.logDate} onChange={e => setForm({ ...form, logDate: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Sample Size</Label>
                <Input type="number" min={0} value={form.sampleSize} onChange={e => setForm({ ...form, sampleSize: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Avg. Weight (g)</Label>
                <Input value={form.averageWeightG} onChange={e => setForm({ ...form, averageWeightG: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createLog.isPending}>Save Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
