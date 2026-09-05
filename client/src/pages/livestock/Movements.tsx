import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, MapPin, ShieldAlert, RotateCw } from "lucide-react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatDate } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  pasture_rotation: "Pasture Rotation",
  quarantine: "Quarantine / Isolation",
  weaning: "Weaning",
  maternity: "Maternity Pen",
  treatment: "Treatment / Clinic",
  housing_change: "Housing / Barn Change",
  sale: "Sale / Dispatch",
  other: "Other",
};

const REASON_COLORS: Record<string, string> = {
  quarantine: "bg-red-100 text-red-800 border-red-200",
  pasture_rotation: "bg-emerald-100 text-emerald-800 border-emerald-200",
  maternity: "bg-rose-100 text-rose-800 border-rose-200",
  treatment: "bg-amber-100 text-amber-800 border-amber-200",
  weaning: "bg-purple-100 text-purple-800 border-purple-200",
  housing_change: "bg-blue-100 text-blue-800 border-blue-200",
  sale: "bg-gray-100 text-gray-800 border-gray-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function Movements() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const utils = trpc.useUtils();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    animalId: "",
    fromLocation: "",
    toLocation: "",
    fromHerdId: "",
    toHerdId: "",
    movementDate: new Date().toISOString().slice(0, 10),
    reason: "pasture_rotation" as any,
    notes: "",
  });

  const { data: animals = [] } = trpc.livestock.listAnimals.useQuery(
    { farmId, status: "active" },
    { enabled: !!farmId }
  );

  const { data: herds = [] } = trpc.livestock.listHerds.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const { data: movements = [], isLoading } = trpc.livestock.listMovements.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const createMovement = trpc.livestock.createMovement.useMutation({
    onSuccess: () => {
      utils.livestock.listMovements.invalidate();
      utils.livestock.listAnimals.invalidate();
      utils.livestock.listHerds.invalidate();
      toast.success("Animal movement recorded & location updated");
      setOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({
      animalId: "",
      fromLocation: "",
      toLocation: "",
      fromHerdId: "",
      toHerdId: "",
      movementDate: new Date().toISOString().slice(0, 10),
      reason: "pasture_rotation",
      notes: "",
    });
  };

  const handleAnimalSelect = (animalIdStr: string) => {
    const animal = animals.find((a) => a.id === parseInt(animalIdStr));
    setForm((prev) => ({
      ...prev,
      animalId: animalIdStr,
      fromLocation: animal?.currentLocation || "",
      fromHerdId: animal?.herdId ? String(animal.herdId) : "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animalId) return toast.error("Please select an animal");
    if (!form.toLocation.trim()) return toast.error("Destination location is required");

    createMovement.mutate({
      farmId,
      animalId: parseInt(form.animalId),
      fromLocation: form.fromLocation || undefined,
      toLocation: form.toLocation,
      fromHerdId: form.fromHerdId ? parseInt(form.fromHerdId) : undefined,
      toHerdId: form.toHerdId ? parseInt(form.toHerdId) : undefined,
      movementDate: form.movementDate,
      reason: form.reason,
      notes: form.notes || undefined,
    });
  };

  return (
    <LivestockLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Animal Movements & Transfers</h2>
            <p className="text-sm text-muted-foreground">
              Track pasture rotations, pen transfers, quarantine admissions, and herd reassignments
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Log Movement
          </Button>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No movements recorded"
            description="Log animal movements across paddocks, barns, isolation pens, or between herds."
            action={
              <Button onClick={() => setOpen(true)}>
                Log Movement
              </Button>
            }
          />
        ) : (
          <div className="border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground font-medium">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Animal</th>
                    <th className="text-left px-4 py-3">Route (From → To)</th>
                    <th className="text-left px-4 py-3">Herd Change</th>
                    <th className="text-left px-4 py-3">Reason</th>
                    <th className="text-left px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.map((m: any) => {
                    const animal = animals.find((a) => a.id === m.animalId);
                    const fromHerd = herds.find((h) => h.id === m.fromHerdId);
                    const toHerd = herds.find((h) => h.id === m.toHerdId);

                    return (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                          {formatDate(m.movementDate)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {animal?.name || animal?.tagNumber || `Animal #${m.animalId}`}
                          {animal?.species && (
                            <span className="text-xs text-muted-foreground block capitalize">{animal.species}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">{m.fromLocation || "Unassigned"}</span>
                            <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="font-semibold text-foreground">{m.toLocation}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {toHerd ? (
                            <span className="font-medium text-primary">
                              {fromHerd ? `${fromHerd.name} → ` : ""}
                              {toHerd.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${REASON_COLORS[m.reason] || "bg-gray-50"}`}
                          >
                            {REASON_LABELS[m.reason] || m.reason}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                          {m.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Animal Movement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Select Animal *</Label>
                <Select value={form.animalId} onValueChange={handleAnimalSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose animal to transfer" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name || a.tagNumber || `Animal #${a.id}`} ({a.species})
                        {a.currentLocation ? ` — currently at ${a.currentLocation}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>From Location</Label>
                  <Input
                    value={form.fromLocation}
                    onChange={(e) => setForm({ ...form, fromLocation: e.target.value })}
                    placeholder="e.g., Paddock 1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>To Location *</Label>
                  <Input
                    value={form.toLocation}
                    onChange={(e) => setForm({ ...form, toLocation: e.target.value })}
                    placeholder="e.g., Paddock 3 / Isolation"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Transfer to Herd (Optional)</Label>
                  <Select
                    value={form.toHerdId}
                    onValueChange={(val) => setForm({ ...form, toHerdId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Keep current herd" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None / Detach</SelectItem>
                      {herds.map((h) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Movement Date *</Label>
                  <Input
                    type="date"
                    value={form.movementDate}
                    onChange={(e) => setForm({ ...form, movementDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Reason for Movement</Label>
                <Select
                  value={form.reason}
                  onValueChange={(val: any) => setForm({ ...form, reason: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REASON_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Reason details, pasture grass conditions, health observations..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMovement.isPending}>
                  Record Movement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </LivestockLayout>
  );
}
