import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, MapPin, Target, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const PURPOSE_LABELS: Record<string, string> = {
  general: "General",
  milking: "Milking Group",
  dry: "Dry Herd",
  calves: "Calves / Nursery",
  heifers: "Heifers",
  fattening: "Fattening / Feedlot",
  quarantine: "Quarantine / Isolation",
  pasture_group: "Pasture Rotation",
};

const PURPOSE_COLORS: Record<string, string> = {
  milking: "bg-blue-100 text-blue-800",
  dry: "bg-amber-100 text-amber-800",
  calves: "bg-purple-100 text-purple-800",
  quarantine: "bg-red-100 text-red-800",
  fattening: "bg-orange-100 text-orange-800",
  general: "bg-gray-100 text-gray-800",
  heifers: "bg-emerald-100 text-emerald-800",
  pasture_group: "bg-teal-100 text-teal-800",
};

export default function Herds() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const utils = trpc.useUtils();

  const [open, setOpen] = useState(false);
  const [editingHerd, setEditingHerd] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    purpose: "general" as any,
    location: "",
    targetHeadCount: "",
    description: "",
  });

  const { data: herds = [], isLoading } = trpc.livestock.listHerds.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const createHerd = trpc.livestock.createHerd.useMutation({
    onSuccess: () => {
      utils.livestock.listHerds.invalidate();
      toast.success("Herd created successfully");
      setOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateHerd = trpc.livestock.updateHerd.useMutation({
    onSuccess: () => {
      utils.livestock.listHerds.invalidate();
      toast.success("Herd updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteHerd = trpc.livestock.deleteHerd.useMutation({
    onSuccess: () => {
      utils.livestock.listHerds.invalidate();
      toast.success("Herd deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setEditingHerd(null);
    setForm({
      name: "",
      code: "",
      purpose: "general",
      location: "",
      targetHeadCount: "",
      description: "",
    });
  };

  const handleOpenEdit = (herd: any) => {
    setEditingHerd(herd);
    setForm({
      name: herd.name || "",
      code: herd.code || "",
      purpose: herd.purpose || "general",
      location: herd.location || "",
      targetHeadCount: herd.targetHeadCount ? String(herd.targetHeadCount) : "",
      description: herd.description || "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Herd name is required");

    if (editingHerd) {
      updateHerd.mutate({
        herdId: editingHerd.id,
        farmId,
        name: form.name,
        code: form.code || undefined,
        purpose: form.purpose,
        location: form.location || undefined,
        targetHeadCount: form.targetHeadCount ? parseInt(form.targetHeadCount) : undefined,
        description: form.description || undefined,
      });
    } else {
      createHerd.mutate({
        farmId,
        name: form.name,
        code: form.code || undefined,
        purpose: form.purpose,
        location: form.location || undefined,
        targetHeadCount: form.targetHeadCount ? parseInt(form.targetHeadCount) : undefined,
        description: form.description || undefined,
      });
    }
  };

  return (
    <LivestockLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Herd & Group Management</h2>
            <p className="text-sm text-muted-foreground">
              Organize animals into production groups, grazing cohorts, and isolation pens
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Herd / Group
          </Button>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : herds.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No herds registered"
            description="Create your first herd or group to manage pasturing, milking cohorts, or calf pens."
            action={
              <Button
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
              >
                Create Herd
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {herds.map((herd: any) => (
              <Card key={herd.id} className="relative overflow-hidden border border-border shadow-sm hover:shadow transition-shadow">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold">{herd.name}</CardTitle>
                      {herd.code && (
                        <span className="text-xs text-muted-foreground font-mono">[{herd.code}]</span>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`mt-2 text-xs font-medium ${PURPOSE_COLORS[herd.purpose] || "bg-gray-100"}`}
                    >
                      {PURPOSE_LABELS[herd.purpose] || herd.purpose}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleOpenEdit(herd)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete herd "${herd.name}"?`)) {
                          deleteHerd.mutate({ herdId: herd.id, farmId });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 text-sm">
                  {herd.description && (
                    <p className="text-muted-foreground text-xs line-clamp-2">{herd.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Current Animals:</span>
                    </div>
                    <span className="font-semibold text-foreground text-base">
                      {herd.currentHeadCount}
                      {herd.targetHeadCount ? (
                        <span className="text-xs text-muted-foreground font-normal"> / {herd.targetHeadCount}</span>
                      ) : null}
                    </span>
                  </div>

                  {herd.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{herd.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingHerd ? "Edit Herd" : "Create New Herd / Group"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Herd / Group Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Milking Cows A, Nursery Calves"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Group Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g., MLK-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Purpose</Label>
                  <Select
                    value={form.purpose}
                    onValueChange={(val: any) => setForm({ ...form, purpose: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PURPOSE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Current Location / Paddock</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Paddock 4 / Barn B"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Target Headcount</Label>
                  <Input
                    type="number"
                    value={form.targetHeadCount}
                    onChange={(e) => setForm({ ...form, targetHeadCount: e.target.value })}
                    placeholder="e.g., 30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description / Notes</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Feeding notes, pasture rotation plans..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createHerd.isPending || updateHerd.isPending}>
                  {editingHerd ? "Save Changes" : "Create Herd"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </LivestockLayout>
  );
}
