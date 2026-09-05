import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Hives() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ apiaryId: 0, identifier: "", hiveType: "langstroth", colonyStatus: "active" as any, notes: "" });

  const { data: hives = [], isLoading } = trpc.beekeeping.listHives.useQuery({ farmId }, { enabled: !!farmId });
  const { data: apiaries = [] } = trpc.beekeeping.listApiaries.useQuery({ farmId }, { enabled: !!farmId });

  const createHive = trpc.beekeeping.createHive.useMutation({
    onSuccess: () => { toast.success("Hive created"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  const apiaryName = (id: number) => apiaries.find((a: any) => a.id === id)?.name || `Apiary ${id}`;

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Hives</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage individual hives</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Add Hive</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : hives.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No hives yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Identifier</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Apiary</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {hives.map((h: any) => (
                <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{h.identifier}</td>
                  <td className="px-4 py-3">{apiaryName(h.apiaryId)}</td>
                  <td className="px-4 py-3 capitalize">{h.hiveType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${h.colonyStatus === "active" ? "bg-emerald-50 text-emerald-700" : h.colonyStatus === "weak" ? "bg-amber-50 text-amber-700" : "bg-muted text-muted-foreground"}`}>{h.colonyStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Hive</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createHive.mutate({ farmId, ...form }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Apiary *</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.apiaryId} onChange={e => setForm({ ...form, apiaryId: parseInt(e.target.value) })} required>
                <option value={0} disabled>Select apiary…</option>
                {apiaries.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Identifier *</Label>
                <Input value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} placeholder="e.g. Hive 1" required />
              </div>
              <div className="space-y-1.5">
                <Label>Hive Type</Label>
                <Input value={form.hiveType} onChange={e => setForm({ ...form, hiveType: e.target.value })} placeholder="langstroth, top-bar…" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Colony Status</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.colonyStatus} onChange={e => setForm({ ...form, colonyStatus: e.target.value as any })}>
                <option value="active">Active</option>
                <option value="weak">Weak</option>
                <option value="swarmed">Swarmed</option>
                <option value="dead">Dead</option>
                <option value="empty">Empty</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createHive.isPending}>Add Hive</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
