import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";

function FeedForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: animals = [] } = trpc.livestock.listAnimals.useQuery({ farmId, status: "active" });
  const [form, setForm] = useState({
    animalId: "",
    feedType: "",
    quantity: "",
    unit: "kg",
    feedDate: new Date().toISOString().slice(0, 10),
    cost: "",
    notes: "",
  });

  const create = trpc.livestock.createFeedRecord.useMutation({
    onSuccess: () => { utils.livestock.listFeedRecords.invalidate(); toast.success("Feed record added"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      farmId,
      animalId: form.animalId && form.animalId !== "all" ? parseInt(form.animalId) : undefined,
      feedType: form.feedType,
      quantity: form.quantity,
      unit: form.unit,
      feedDate: form.feedDate,
      cost: form.cost || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Animal</Label>
          <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })}>
            <SelectTrigger><SelectValue placeholder="Herd-wide" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Herd-wide</SelectItem>
              {animals.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name ?? a.tagNumber ?? `${a.species} #${a.id}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Feed Type *</Label>
          <Input value={form.feedType} onChange={(e) => setForm({ ...form, feedType: e.target.value })} placeholder="e.g. Dairy Meal, Hay" required />
        </div>
        <div className="space-y-1.5">
          <Label>Quantity *</Label>
          <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" required />
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["kg", "g", "litres", "bags", "bales"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Feed Date *</Label>
          <Input type="date" value={form.feedDate} onChange={(e) => setForm({ ...form, feedDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Cost</Label>
          <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0.00" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending}>Add Record</Button>
      </div>
    </form>
  );
}

export default function FeedRecords() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: records = [], isLoading } = trpc.livestock.listFeedRecords.useQuery({ farmId }, { enabled: !!farmId });

  const totalCost = records.reduce((s, r) => s + (parseFloat(String(r.cost ?? 0)) || 0), 0);

  return (
    <LivestockLayout>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{records.length} records · Total cost: <span className="font-semibold text-foreground">{totalCost.toFixed(2)}</span></p>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add Record
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No feed records</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{r.feedType}</p>
                    <p className="text-xs text-muted-foreground">{String(r.feedDate).slice(0, 10)} · {r.quantity} {r.unit}</p>
                  </div>
                  {r.cost && <span className="text-sm font-semibold text-foreground">{r.cost}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Feed Record</DialogTitle></DialogHeader>
          <FeedForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </LivestockLayout>
  );
}
