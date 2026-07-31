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
import { Leaf, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CropsLayout from "./CropsLayout";

const QUALITY_COLORS: Record<string, string> = {
  excellent: "bg-emerald-100 text-emerald-700",
  good: "bg-green-100 text-green-700",
  fair: "bg-amber-100 text-amber-700",
  poor: "bg-red-100 text-red-700",
};

function HarvestForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: plantings = [] } = trpc.crops.listPlantings.useQuery({ farmId });
  const [form, setForm] = useState({
    cropName: "",
    plantingId: "",
    harvestDate: new Date().toISOString().slice(0, 10),
    yieldAmount: "",
    yieldUnit: "kg",
    quality: "good" as const,
    soldAmount: "",
    pricePerUnit: "",
    notes: "",
  });

  const create = trpc.crops.createHarvest.useMutation({
    onSuccess: () => { utils.crops.listHarvests.invalidate(); toast.success("Harvest logged"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      ...form,
      farmId,
      plantingId: form.plantingId ? parseInt(form.plantingId) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Crop Name *</Label>
          <Input value={form.cropName} onChange={(e) => setForm({ ...form, cropName: e.target.value })} placeholder="e.g. Maize" required />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Link to Planting</Label>
          <Select value={form.plantingId} onValueChange={(v) => setForm({ ...form, plantingId: v })}>
            <SelectTrigger><SelectValue placeholder="Select planting (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {plantings.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.cropName} ({String(p.plantingDate).slice(0, 10)})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Harvest Date *</Label>
          <Input type="date" value={form.harvestDate} onChange={(e) => setForm({ ...form, harvestDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Quality</Label>
          <Select value={form.quality} onValueChange={(v) => setForm({ ...form, quality: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["excellent", "good", "fair", "poor"].map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Yield Amount *</Label>
          <Input type="number" value={form.yieldAmount} onChange={(e) => setForm({ ...form, yieldAmount: e.target.value })} placeholder="0" required />
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Select value={form.yieldUnit} onValueChange={(v) => setForm({ ...form, yieldUnit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["kg", "tonnes", "bags", "crates", "litres", "pieces"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount Sold</Label>
          <Input type="number" value={form.soldAmount} onChange={(e) => setForm({ ...form, soldAmount: e.target.value })} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Price per Unit</Label>
          <Input type="number" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} placeholder="0.00" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending}>Log Harvest</Button>
      </div>
    </form>
  );
}

export default function Harvests() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: harvests = [], isLoading } = trpc.crops.listHarvests.useQuery({ farmId }, { enabled: !!farmId });

  const totalYield = harvests.reduce((sum, h) => sum + (parseFloat(String(h.yieldAmount)) || 0), 0);

  return (
    <CropsLayout>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {harvests.length} records · Total yield: <span className="font-semibold text-foreground">{totalYield.toFixed(1)} kg equiv.</span>
        </div>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Log Harvest
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : harvests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Leaf className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No harvests recorded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {harvests.map((h) => (
            <Card key={h.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{h.cropName}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", QUALITY_COLORS[h.quality ?? "good"])}>
                        {h.quality}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{String(h.harvestDate).slice(0, 10)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{h.yieldAmount} {h.yieldUnit}</p>
                    {h.soldAmount && <p className="text-xs text-muted-foreground">Sold: {h.soldAmount} {h.yieldUnit}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Harvest</DialogTitle></DialogHeader>
          <HarvestForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </CropsLayout>
  );
}
