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
import { Skull, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";

function MortalityForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: animals = [] } = trpc.livestock.listAnimals.useQuery({ farmId, status: "active" });
  const [form, setForm] = useState({
    animalId: "",
    deathDate: new Date().toISOString().slice(0, 10),
    cause: "",
    causeCategory: "unknown" as "disease" | "injury" | "natural" | "predator" | "unknown" | "other",
    disposalMethod: "",
    notes: "",
  });

  const create = trpc.livestock.createMortality.useMutation({
    onSuccess: () => { utils.livestock.listMortality.invalidate(); utils.livestock.listAnimals.invalidate(); toast.success("Mortality recorded"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      farmId,
      animalId: parseInt(form.animalId),
      deathDate: form.deathDate,
      cause: form.cause || undefined,
      causeCategory: form.causeCategory,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Animal *</Label>
          <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })} required>
            <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
            <SelectContent>
              {animals.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name ?? a.tagNumber ?? `${a.species} #${a.id}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date of Death *</Label>
          <Input type="date" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Cause</Label>
          <Input value={form.cause} onChange={(e) => setForm({ ...form, cause: e.target.value })} placeholder="e.g. Pneumonia, broken leg" />
        </div>
        <div className="space-y-1.5">
          <Label>Cause Category</Label>
          <Select value={form.causeCategory} onValueChange={(v) => setForm({ ...form, causeCategory: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="disease">Disease</SelectItem>
              <SelectItem value="injury">Injury</SelectItem>
              <SelectItem value="natural">Natural</SelectItem>
              <SelectItem value="predator">Predator</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Disposal Method</Label>
          <Select value={form.disposalMethod} onValueChange={(v) => setForm({ ...form, disposalMethod: v })}>
            <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
            <SelectContent>
              {["burial", "incineration", "composting", "sold", "other"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="destructive" disabled={create.isPending || !form.animalId}>Record Mortality</Button>
      </div>
    </form>
  );
}

export default function Mortality() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: records = [], isLoading } = trpc.livestock.listMortality.useQuery({ farmId }, { enabled: !!farmId });

  return (
    <LivestockLayout>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{records.length} mortality records</p>
        {can("write") && (
          <Button size="sm" variant="destructive" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Record Mortality
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Skull className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No mortality records</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.id} className="border-0 shadow-sm border-l-2 border-l-destructive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">Animal #{r.animalId}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(r.deathDate).slice(0, 10)}
                      {r.cause ? ` · Cause: ${r.cause}` : ""}
                      {r.causeCategory ? ` · ${r.causeCategory}` : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Mortality</DialogTitle></DialogHeader>
          <MortalityForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </LivestockLayout>
  );
}
