import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function DairyAnimals() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tagNumber: "", breed: "", gender: "female" as "male" | "female", acquisitionType: "born" as any, notes: "" });

  const { data: animals = [], isLoading } = trpc.dairy.listAnimals.useQuery({ farmId }, { enabled: !!farmId });

  const createAnimal = trpc.dairy.createAnimal.useMutation({
    onSuccess: () => { toast.success("Animal registered"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dairy Animals</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your dairy herd</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Add Animal</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : animals.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No animals registered yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name / Tag</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Breed</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Gender</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {animals.map((a: any) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{a.name || a.tagNumber || `#${a.id}`}</td>
                  <td className="px-4 py-3">{a.breed || "—"}</td>
                  <td className="px-4 py-3 capitalize">{a.gender}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${a.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register Animal</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createAnimal.mutate({ farmId, ...form }); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tag Number</Label>
                <Input value={form.tagNumber} onChange={e => setForm({ ...form, tagNumber: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Breed</Label>
                <Input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as any })}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Acquisition Type</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.acquisitionType} onChange={e => setForm({ ...form, acquisitionType: e.target.value as any })}>
                <option value="born">Born on Farm</option>
                <option value="purchased">Purchased</option>
                <option value="donated">Donated</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createAnimal.isPending}>Register Animal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
