import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Flocks() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", breed: "", birdType: "layer", quantity: "", housing: "", notes: "" });

  const { data: flocks = [], isLoading } = trpc.poultry.listFlocks.useQuery({ farmId }, { enabled: !!farmId });

  const createFlock = trpc.poultry.createFlock.useMutation({
    onSuccess: () => { toast.success("Flock created"); setOpen(false); setForm({ name: "", breed: "", birdType: "layer", quantity: "", housing: "", notes: "" }); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Flocks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your poultry flocks</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">New Flock</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : flocks.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No flocks yet. Create your first flock.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bird Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Breed</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Quantity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {flocks.map((flock: any) => (
                <tr key={flock.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{flock.name}</td>
                  <td className="px-4 py-3 capitalize">{flock.birdType}</td>
                  <td className="px-4 py-3">{flock.breed || "—"}</td>
                  <td className="px-4 py-3">{flock.quantity?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${flock.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {flock.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Flock</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createFlock.mutate({ farmId, ...form, quantity: parseInt(form.quantity) || 0 }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Flock Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Bird Type</Label>
                <Input value={form.birdType} onChange={e => setForm({ ...form, birdType: e.target.value })} placeholder="layer, broiler…" />
              </div>
              <div className="space-y-1.5">
                <Label>Breed</Label>
                <Input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Housing</Label>
                <Input value={form.housing} onChange={e => setForm({ ...form, housing: e.target.value })} placeholder="House A, Coop 1…" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createFlock.isPending}>Create Flock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
