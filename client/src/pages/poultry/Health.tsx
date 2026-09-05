import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Health() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ flockId: 0, date: new Date().toISOString().slice(0, 10), condition: "", affectedQuantity: "", treatment: "", notes: "" });

  const { data: logs = [], isLoading } = trpc.poultry.listHealthLogs.useQuery({ farmId }, { enabled: !!farmId });
  const { data: flocks = [] } = trpc.poultry.listFlocks.useQuery({ farmId }, { enabled: !!farmId });

  const createLog = trpc.poultry.createHealthLog.useMutation({
    onSuccess: () => { toast.success("Health log saved"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Health Logs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track flock health conditions and treatments</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Log Health Event</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : logs.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No health logs yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Condition</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Affected</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Treatment</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{l.date}</td>
                  <td className="px-4 py-3">{l.condition || "—"}</td>
                  <td className="px-4 py-3">{l.affectedQuantity ?? "—"}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{l.treatment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Health Event</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createLog.mutate({ farmId, ...form, affectedQuantity: parseInt(form.affectedQuantity) || undefined }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Flock</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.flockId} onChange={e => setForm({ ...form, flockId: parseInt(e.target.value) })}>
                <option value={0} disabled>Select flock…</option>
                {flocks.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Affected Quantity</Label>
                <Input type="number" min={0} value={form.affectedQuantity} onChange={e => setForm({ ...form, affectedQuantity: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Input value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} placeholder="e.g. Newcastle Disease" />
            </div>
            <div className="space-y-1.5">
              <Label>Treatment</Label>
              <Input value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} />
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
