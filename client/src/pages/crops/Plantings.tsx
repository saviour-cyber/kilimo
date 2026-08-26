import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarDays, Plus, Sprout } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CropsLayout from "./CropsLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const STAGE_COLORS: Record<string, string> = {
  seedling: "bg-lime-100 text-lime-700",
  vegetative: "bg-green-100 text-green-700",
  flowering: "bg-pink-100 text-pink-700",
  fruiting: "bg-orange-100 text-orange-700",
  harvest_ready: "bg-amber-100 text-amber-700",
  harvested: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
  archived: "bg-slate-100 text-slate-600",
};

function PlantingForm({ farmId, planting, onClose }: { farmId: number; planting?: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: fields = [] } = trpc.crops.listFields.useQuery({ farmId });
  const [form, setForm] = useState({
    cropName: planting?.cropName ?? "",
    variety: planting?.variety ?? "",
    fieldId: planting?.fieldId ? String(planting.fieldId) : "",
    plantingDate: planting?.plantingDate ? String(planting.plantingDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    expectedHarvestDate: planting?.expectedHarvestDate ? String(planting.expectedHarvestDate).slice(0, 10) : "",
    quantityPlanted: planting?.quantityPlanted ? String(planting.quantityPlanted) : "",
    quantityUnit: planting?.quantityUnit ?? "kg",
    growthStage: planting?.growthStage ?? "seedling",
    status: planting?.status ?? "active",
    season: planting?.season ?? "",
    notes: planting?.notes ?? "",
  });

  const create = trpc.crops.createPlanting.useMutation({
    onSuccess: () => { utils.crops.listPlantings.invalidate(); toast.success("Planting created"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.crops.updatePlanting.useMutation({
    onSuccess: () => { utils.crops.listPlantings.invalidate(); toast.success("Planting updated"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, farmId, fieldId: form.fieldId ? parseInt(form.fieldId) : undefined };
    if (planting) update.mutate({ ...data, plantingId: planting.id });
    else create.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Crop Name *</Label>
          <Input value={form.cropName} onChange={(e) => setForm({ ...form, cropName: e.target.value })} placeholder="e.g. Maize" required />
        </div>
        <div className="space-y-1.5">
          <Label>Variety</Label>
          <Input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} placeholder="e.g. H614D" />
        </div>
        <div className="space-y-1.5">
          <Label>Field</Label>
          <Select value={form.fieldId} onValueChange={(v) => setForm({ ...form, fieldId: v })}>
            <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific field</SelectItem>
              {fields.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Planting Date *</Label>
          <Input type="date" value={form.plantingDate} onChange={(e) => setForm({ ...form, plantingDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Expected Harvest</Label>
          <Input type="date" value={form.expectedHarvestDate} onChange={(e) => setForm({ ...form, expectedHarvestDate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Quantity Planted</Label>
          <Input type="number" value={form.quantityPlanted} onChange={(e) => setForm({ ...form, quantityPlanted: e.target.value })} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Select value={form.quantityUnit} onValueChange={(v) => setForm({ ...form, quantityUnit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["kg", "g", "seeds", "bags", "cuttings", "seedlings"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Growth Stage</Label>
          <Select value={form.growthStage} onValueChange={(v) => setForm({ ...form, growthStage: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(STAGE_COLORS).map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Season</Label>
          <Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="e.g. 2024 Long Rains" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {planting ? "Update" : "Create"} Planting
        </Button>
      </div>
    </form>
  );
}

export default function Plantings() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlanting, setEditPlanting] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("active");

  const { data: plantings = [], isLoading } = trpc.crops.listPlantings.useQuery(
    { farmId, status: statusFilter === "all" ? undefined : statusFilter },
    { enabled: !!farmId }
  );

  return (
    <CropsLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {["all", "active", "completed", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add Planting
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="list" />
      ) : plantings.length === 0 ? (
        <EmptyState 
          icon={Sprout} 
          title="No plantings found" 
          description="Record your first planting to track crop progress" 
        />
      ) : (
        <div className="space-y-2">
          {plantings.map((p) => (
            <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{p.cropName}</h3>
                      {p.variety && <span className="text-xs text-muted-foreground">({p.variety})</span>}
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium", STAGE_COLORS[p.growthStage])}>
                        {p.growthStage.replace("_", " ")}
                      </span>
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[p.status])}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        Planted: {String(p.plantingDate).slice(0, 10)}
                      </span>
                      {p.expectedHarvestDate && (
                        <span>Harvest: {String(p.expectedHarvestDate).slice(0, 10)}</span>
                      )}
                      {p.season && <span>{p.season}</span>}
                      {p.quantityPlanted && <span>{p.quantityPlanted} {p.quantityUnit}</span>}
                    </div>
                  </div>
                  {can("write") && (
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditPlanting(p)}>Edit</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Planting</DialogTitle></DialogHeader>
          <PlantingForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPlanting} onOpenChange={(o) => !o && setEditPlanting(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Planting</DialogTitle></DialogHeader>
          {editPlanting && <PlantingForm farmId={farmId} planting={editPlanting} onClose={() => setEditPlanting(null)} />}
        </DialogContent>
      </Dialog>
    </CropsLayout>
  );
}
