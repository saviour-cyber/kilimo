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
import { cn } from "@/lib/utils";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";

const OUTCOME_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  successful: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  aborted: "bg-slate-100 text-slate-600",
};

function BreedingForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: animals = [] } = trpc.livestock.listAnimals.useQuery({ farmId, status: "active" });
  const females = animals.filter((a) => a.gender === "female");
  const males = animals.filter((a) => a.gender === "male");

  const [form, setForm] = useState({
    damId: "",
    sireId: "",
    sireDescription: "",
    breedingDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: "",
    notes: "",
  });

  const create = trpc.livestock.createBreeding.useMutation({
    onSuccess: () => { utils.livestock.listBreeding.invalidate(); toast.success("Breeding record created"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      farmId,
      damId: parseInt(form.damId),
      sireId: form.sireId && form.sireId !== "external" ? parseInt(form.sireId) : undefined,
      sireDescription: form.sireDescription || undefined,
      breedingDate: form.breedingDate,
      expectedDeliveryDate: form.expectedDeliveryDate || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Dam (Female) *</Label>
          <Select value={form.damId} onValueChange={(v) => setForm({ ...form, damId: v })} required>
            <SelectTrigger><SelectValue placeholder="Select female animal" /></SelectTrigger>
            <SelectContent>
              {females.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name ?? a.tagNumber ?? a.species} ({a.breed})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Sire (Male)</Label>
          <Select value={form.sireId} onValueChange={(v) => setForm({ ...form, sireId: v })}>
            <SelectTrigger><SelectValue placeholder="Select male animal (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="external">External sire</SelectItem>
              {males.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name ?? a.tagNumber ?? a.species}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {form.sireId === "external" && (
          <div className="space-y-1.5 col-span-2">
            <Label>Sire Description</Label>
            <Input value={form.sireDescription} onChange={(e) => setForm({ ...form, sireDescription: e.target.value })} placeholder="e.g. Purchased AI from XYZ" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Breeding Date *</Label>
          <Input type="date" value={form.breedingDate} onChange={(e) => setForm({ ...form, breedingDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Expected Delivery</Label>
          <Input type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || !form.damId}>Create Record</Button>
      </div>
    </form>
  );
}

export default function Breeding() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: records = [], isLoading } = trpc.livestock.listBreeding.useQuery({ farmId }, { enabled: !!farmId });

  return (
    <LivestockLayout>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{records.length} breeding records</p>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add Record
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No breeding records</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Dam #{r.damId}</span>
                      {r.sireId && <span className="text-xs text-muted-foreground">× Sire #{r.sireId}</span>}
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", OUTCOME_COLORS[r.outcome])}>{r.outcome}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Bred: {String(r.breedingDate).slice(0, 10)}</p>
                    {r.expectedDeliveryDate && <p className="text-xs text-muted-foreground">Expected: {String(r.expectedDeliveryDate).slice(0, 10)}</p>}
                  </div>
                  {r.offspringCount != null && (
                    <div className="text-right">
                      <p className="font-bold text-foreground">{r.offspringCount}</p>
                      <p className="text-xs text-muted-foreground">offspring</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Breeding Record</DialogTitle></DialogHeader>
          <BreedingForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </LivestockLayout>
  );
}
