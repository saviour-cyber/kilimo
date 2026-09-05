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

export default function BeekeepingHarvests() {
  const { currentFarm } = useFarm();
  const qc = useQueryClient();
  const farmId = currentFarm?.farm.id ?? 0;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ hiveId: 0, harvestDate: new Date().toISOString().slice(0, 10), productType: "honey", quantityKg: "", notes: "" });

  const { data: harvests = [], isLoading } = trpc.beekeeping.listHarvests.useQuery({ farmId }, { enabled: !!farmId });
  const { data: hives = [] } = trpc.beekeeping.listHives.useQuery({ farmId }, { enabled: !!farmId });

  const createHarvest = trpc.beekeeping.createHarvest.useMutation({
    onSuccess: () => { toast.success("Harvest recorded"); setOpen(false); qc.invalidateQueries(); },
    onError: (e) => toast.error(e.message),
  });

  const hiveName = (id: number) => hives.find((h: any) => h.id === id)?.identifier || `Hive ${id}`;

  if (!farmId) return <p className="text-sm text-muted-foreground p-4">Select a farm to continue.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Harvests</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Honey and wax harvest records</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">Record Harvest</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : harvests.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">No harvest records yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hive</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Quantity (kg)</th>
              </tr>
            </thead>
            <tbody>
              {harvests.map((h: any) => (
                <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{formatDate(h.harvestDate)}</td>
                  <td className="px-4 py-3">{hiveName(h.hiveId)}</td>
                  <td className="px-4 py-3 capitalize">{h.productType}</td>
                  <td className="px-4 py-3 font-medium">{h.quantityKg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Harvest</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            const selectedHive = hives.find((h: any) => h.id === form.hiveId);
            createHarvest.mutate({ 
              farmId, 
              apiaryId: selectedHive?.apiaryId ?? 0,
              ...form 
            }); 
          }} className="space-y-4">
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
                <Input type="date" value={form.harvestDate} onChange={e => setForm({ ...form, harvestDate: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Product Type</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })}>
                  <option value="honey">Honey</option>
                  <option value="wax">Wax</option>
                  <option value="propolis">Propolis</option>
                  <option value="pollen">Pollen</option>
                  <option value="royal_jelly">Royal Jelly</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity (kg)</Label>
              <Input value={form.quantityKg} onChange={e => setForm({ ...form, quantityKg: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createHarvest.isPending}>Record Harvest</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
