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

export default function Mortality() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ flockId: 0, date: new Date().toISOString().slice(0, 10), quantity: "", suspectedCause: "", notes: "" });

  const { data: records = [], isLoading } = trpc.poultry.listMortality.useQuery({ farmId }, { enabled: !!farmId });
  const { data: flocks = [] } = trpc.poultry.listFlocks.useQuery({ farmId }, { enabled: !!farmId });

  const createRecord = trpc.poultry.createMortality.useMutation({
    onSuccess: () => { toast.success("Mortality record saved"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mortality Records</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track flock deaths and suspected causes</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Record Mortality</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No mortality records.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Quantity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Suspected Cause</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{r.quantity}</td>
                  <td className="px-4 py-3">{r.suspectedCause || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Mortality</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createRecord.mutate({ farmId, ...form, quantity: parseInt(form.quantity) || 1 }); }} className="space-y-4">
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
                <Label>Quantity *</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Suspected Cause</Label>
              <Input value={form.suspectedCause} onChange={e => setForm({ ...form, suspectedCause: e.target.value })} />
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
