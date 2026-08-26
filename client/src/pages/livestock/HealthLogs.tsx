import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { DiseaseDetector } from "@/components/intelligence/DiseaseDetector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Activity, Plus, Syringe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const LOG_TYPE_COLORS: Record<string, string> = {
  vaccination: "bg-blue-100 text-blue-700",
  treatment: "bg-amber-100 text-amber-700",
  checkup: "bg-green-100 text-green-700",
  surgery: "bg-red-100 text-red-700",
  weight: "bg-purple-100 text-purple-700",
  other: "bg-slate-100 text-slate-600",
};

function HealthLogForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: animals = [] } = trpc.livestock.listAnimals.useQuery({ farmId, status: "active" });
  const [form, setForm] = useState({
    animalId: "",
    logType: "checkup" as const,
    title: "",
    description: "",
    performedDate: new Date().toISOString().slice(0, 10),
    nextDueDate: "",
    performedBy: "",
    cost: "",
    notes: "",
  });

  const create = trpc.livestock.createHealthLog.useMutation({
    onSuccess: () => { utils.livestock.listHealthLogs.invalidate(); toast.success("Health log added"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      farmId,
      animalId: form.animalId ? parseInt(form.animalId) : undefined,
      logType: form.logType,
      title: form.title,
      description: form.description || undefined,
      performedDate: form.performedDate,
      nextDueDate: form.nextDueDate || undefined,
      performedBy: form.performedBy || undefined,
      cost: form.cost || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Animal</Label>
          <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })}>
            <SelectTrigger><SelectValue placeholder="All animals / herd-wide" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Herd-wide</SelectItem>
              {animals.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name ?? a.tagNumber ?? `${a.species} #${a.id}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Log Type</Label>
          <Select value={form.logType} onValueChange={(v) => setForm({ ...form, logType: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["vaccination", "treatment", "checkup", "surgery", "weight", "other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Performed Date *</Label>
          <Input type="date" value={form.performedDate} onChange={(e) => setForm({ ...form, performedDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. FMD Vaccination" required />
        </div>
        <div className="space-y-1.5">
          <Label>Performed By</Label>
          <Input value={form.performedBy} onChange={(e) => setForm({ ...form, performedBy: e.target.value })} placeholder="Vet name" />
        </div>
        <div className="space-y-1.5">
          <Label>Cost</Label>
          <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0.00" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Next Due Date</Label>
          <Input type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending}>Add Log</Button>
      </div>
    </form>
  );
}

export default function HealthLogs() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: logs = [], isLoading } = trpc.livestock.listHealthLogs.useQuery({ farmId }, { enabled: !!farmId });

  return (
    <LivestockLayout>
      <div className="mb-6">
        <DiseaseDetector type="livestock" />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{logs.length} health records</p>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add Log
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="list" />
      ) : logs.length === 0 ? (
        <EmptyState 
          icon={Activity} 
          title="No health records" 
          description="Log health treatments and checkups" 
        />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium", LOG_TYPE_COLORS[log.logType])}>{log.logType}</span>
                      <span className="font-semibold text-foreground text-sm">{log.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {String(log.performedDate).slice(0, 10)}
                      {log.performedBy ? ` · ${log.performedBy}` : ""}
                      {log.nextDueDate ? ` · Next: ${String(log.nextDueDate).slice(0, 10)}` : ""}
                    </p>
                  </div>
                  {log.cost && <span className="text-sm font-semibold text-foreground">{log.cost}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Health Log</DialogTitle></DialogHeader>
          <HealthLogForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </LivestockLayout>
  );
}
