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

export default function Calving() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ animalId: 0, expectedDate: "", actualDate: "", calfCount: "", complications: "", notes: "" });

  const { data: records = [], isLoading } = trpc.dairy.listCalving.useQuery({ farmId }, { enabled: !!farmId });
  const { data: animals = [] } = trpc.dairy.listAnimals.useQuery({ farmId }, { enabled: !!farmId });

  const createRecord = trpc.dairy.createCalving.useMutation({
    onSuccess: () => { toast.success("Calving record saved"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  const animalName = (id: number) => { const a = animals.find((x: any) => x.id === id); return a ? (a.name || a.tagNumber || `#${a.id}`) : `Animal ${id}`; };

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Calving Records</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track calving events</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Add Record</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No calving records yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Animal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expected</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actual</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Calves</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{animalName(r.animalId)}</td>
                  <td className="px-4 py-3">{formatDate(r.expectedDate)}</td>
                  <td className="px-4 py-3">{formatDate(r.actualDate)}</td>
                  <td className="px-4 py-3">{r.calfCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Calving Record</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createRecord.mutate({ farmId, ...form, calfCount: parseInt(form.calfCount) || 1 }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Animal *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.animalId} onChange={e => setForm({ ...form, animalId: parseInt(e.target.value) })} required>
                <option value={0} disabled>Select animal…</option>
                {animals.filter((a: any) => a.gender === "female").map((a: any) => <option key={a.id} value={a.id}>{a.name || a.tagNumber || `#${a.id}`}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Expected Date</Label>
                <Input type="date" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Actual Date</Label>
                <Input type="date" value={form.actualDate} onChange={e => setForm({ ...form, actualDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Number of Calves</Label>
              <Input type="number" min={1} value={form.calfCount} onChange={e => setForm({ ...form, calfCount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Complications</Label>
              <Input value={form.complications} onChange={e => setForm({ ...form, complications: e.target.value })} />
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
