import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Inspections() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ hiveId: 0, date: new Date().toISOString().slice(0, 10), framesOfBees: 0, framesOfBrood: 0, hasQueen: true, notes: "" });

  const { data: records = [], isLoading } = trpc.beekeeping.listInspections.useQuery({ farmId }, { enabled: !!farmId });
  const { data: hives = [] } = trpc.beekeeping.listHives.useQuery({ farmId }, { enabled: !!farmId });

  const createRecord = trpc.beekeeping.createInspection.useMutation({
    onSuccess: () => { toast.success("Inspection logged"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  const hiveName = (id: number) => hives.find((h: any) => h.id === id)?.identifier || `Hive ${id}`;

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inspections</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Hive inspection logs</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Log Inspection</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No inspection records yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hive</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Frames (Bees/Brood)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Queen Spotted</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{r.date}</td>
                  <td className="px-4 py-3">{hiveName(r.hiveId)}</td>
                  <td className="px-4 py-3">{r.framesOfBees || 0} / {r.framesOfBrood || 0}</td>
                  <td className="px-4 py-3">{r.hasQueen ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Inspection</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createRecord.mutate({ farmId, ...form }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Hive *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.hiveId} onChange={e => setForm({ ...form, hiveId: parseInt(e.target.value) })} required>
                <option value={0} disabled>Select hive…</option>
                {hives.map((h: any) => <option key={h.id} value={h.id}>{h.identifier}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="flex items-center space-x-2 mt-8">
                <input type="checkbox" id="hasQueen" checked={form.hasQueen} onChange={e => setForm({ ...form, hasQueen: e.target.checked })} />
                <Label htmlFor="hasQueen">Queen Spotted</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Frames of Bees</Label>
                <Input type="number" min={0} value={form.framesOfBees} onChange={e => setForm({ ...form, framesOfBees: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Frames of Brood</Label>
                <Input type="number" min={0} value={form.framesOfBrood} onChange={e => setForm({ ...form, framesOfBrood: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createRecord.isPending}>Save Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
