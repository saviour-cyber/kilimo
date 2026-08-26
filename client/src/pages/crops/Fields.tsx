import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Ruler } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CropsLayout from "./CropsLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

function FieldCard({ field, farmId, onEdit }: { field: any; farmId: number; onEdit: () => void }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm">{field.name}</h3>
            {field.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {field.location}
              </div>
            )}
            {field.sizeHectares && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Ruler className="w-3 h-3" />
                {field.sizeHectares} ha
              </div>
            )}
            {field.soilType && (
              <span className="text-xs text-muted-foreground">Soil: {field.soilType}</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-2 text-xs">Edit</Button>
        </div>
        {field.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{field.notes}</p>}
      </CardContent>
    </Card>
  );
}

function FieldForm({ farmId, field, onClose }: { farmId: number; field?: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: field?.name ?? "",
    sizeHectares: field?.sizeHectares ? String(field.sizeHectares) : "",
    soilType: field?.soilType ?? "",
    location: field?.location ?? "",
    notes: field?.notes ?? "",
  });

  const create = trpc.crops.createField.useMutation({
    onSuccess: () => { utils.crops.listFields.invalidate(); toast.success("Field created"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.crops.updateField.useMutation({
    onSuccess: () => { utils.crops.listFields.invalidate(); toast.success("Field updated"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (field) update.mutate({ ...form, fieldId: field.id, farmId });
    else create.mutate({ ...form, farmId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Field Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. North Plot" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Size (hectares)</Label>
          <Input type="number" value={form.sizeHectares} onChange={(e) => setForm({ ...form, sizeHectares: e.target.value })} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>Soil Type</Label>
          <Input value={form.soilType} onChange={(e) => setForm({ ...form, soilType: e.target.value })} placeholder="e.g. Loam" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Location</Label>
        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="GPS or description" />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {field ? "Update" : "Create"} Field
        </Button>
      </div>
    </form>
  );
}

export default function Fields() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editField, setEditField] = useState<any>(null);

  const { data: fields = [], isLoading } = trpc.crops.listFields.useQuery({ farmId }, { enabled: !!farmId });

  return (
    <CropsLayout>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{fields.length} field{fields.length !== 1 ? "s" : ""}</p>
        {can("write") && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Add Field</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Field</DialogTitle></DialogHeader>
              <FieldForm farmId={farmId} onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="cards" />
      ) : fields.length === 0 ? (
        <EmptyState 
          icon={MapPin} 
          title="No fields yet" 
          description="Add your first field to start tracking crops" 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              farmId={farmId}
              onEdit={() => { setEditField(field); setDialogOpen(true); }}
            />
          ))}
        </div>
      )}

      <Dialog open={!!editField} onOpenChange={(o) => !o && setEditField(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Field</DialogTitle></DialogHeader>
          {editField && <FieldForm farmId={farmId} field={editField} onClose={() => setEditField(null)} />}
        </DialogContent>
      </Dialog>
    </CropsLayout>
  );
}
