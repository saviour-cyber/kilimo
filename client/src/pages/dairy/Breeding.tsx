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

export default function DairyBreeding() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ animalId: 0, eventDate: new Date().toISOString().slice(0, 10), method: "", sireInfo: "", pregnancyStatus: "pending" as any, notes: "" });

  const { data: records = [], isLoading } = trpc.dairy.listBreeding.useQuery({ farmId }, { enabled: !!farmId });
  const { data: animals = [] } = trpc.dairy.listAnimals.useQuery({ farmId }, { enabled: !!farmId });

  const createRecord = trpc.dairy.createBreeding.useMutation({
    onSuccess: () => { toast.success("Breeding record saved"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  const animalName = (id: number) => { const a = animals.find((x: any) => x.id === id); return a ? (a.name || a.tagNumber || `#${a.id}`) : `Animal ${id}`; };

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Breeding Records</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track breeding events and pregnancy status</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Add Record</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No breeding records yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Animal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pregnancy</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{formatDate(r.eventDate)}</td>
                  <td className="px-4 py-3">{animalName(r.animalId)}</td>
                  <td className="px-4 py-3">{r.method || "—"}</td>
                  <td className="px-4 py-3 capitalize">{r.pregnancyStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Breeding Record</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createRecord.mutate({ farmId, ...form }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Animal *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.animalId} onChange={e => setForm({ ...form, animalId: parseInt(e.target.value) })} required>
                <option value={0} disabled>Select animal…</option>
                {animals.filter((a: any) => a.gender === "female").map((a: any) => <option key={a.id} value={a.id}>{a.name || a.tagNumber || `#${a.id}`}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Input value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} placeholder="AI, natural…" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Pregnancy Status</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.pregnancyStatus} onChange={e => setForm({ ...form, pregnancyStatus: e.target.value as any })}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Sire Info</Label>
              <Input value={form.sireInfo} onChange={e => setForm({ ...form, sireInfo: e.target.value })} placeholder="Sire name or details" />
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
