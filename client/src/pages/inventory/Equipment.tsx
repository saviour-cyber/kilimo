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
import { Wrench, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import InventoryLayout from "./InventoryLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const STATUS_COLORS: Record<string, string> = {
  operational: "bg-green-100 text-green-700",
  maintenance: "bg-amber-100 text-amber-700",
  repair: "bg-red-100 text-red-700",
  retired: "bg-slate-100 text-slate-600",
};

function EquipmentForm({ farmId, item, onClose }: { farmId: number; item?: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: item?.name ?? "",
    category: item?.category ?? "machinery",
    serialNumber: item?.serialNumber ?? "",
    purchaseDate: item?.purchaseDate ? String(item.purchaseDate).slice(0, 10) : "",
    purchaseCost: item?.purchaseCost ? String(item.purchaseCost) : "",
    status: item?.status ?? "operational",
    nextMaintenanceDate: item?.nextMaintenanceDate ? String(item.nextMaintenanceDate).slice(0, 10) : "",
    notes: item?.notes ?? "",
  });

  const create = trpc.inventory.createEquipment.useMutation({
    onSuccess: () => { utils.inventory.listEquipment.invalidate(); toast.success("Equipment added"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  const update = trpc.inventory.updateEquipment.useMutation({
    onSuccess: () => { utils.inventory.listEquipment.invalidate(); toast.success("Equipment updated"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, farmId, status: form.status as any };
    if (item) update.mutate({ ...payload, equipmentId: item.id });
    else create.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Equipment Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tractor" required />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["machinery", "tools", "vehicles", "irrigation", "storage", "other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["operational", "maintenance", "repair", "retired"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Serial Number</Label>
          <Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Purchase Cost</Label>
          <Input type="number" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>Purchase Date</Label>
          <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Next Maintenance</Label>
          <Input type="date" value={form.nextMaintenanceDate} onChange={(e) => setForm({ ...form, nextMaintenanceDate: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {item ? "Update" : "Add"} Equipment
        </Button>
      </div>
    </form>
  );
}

export default function Equipment() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const { data: items = [], isLoading } = trpc.inventory.listEquipment.useQuery({ farmId }, { enabled: !!farmId });

  return (
    <InventoryLayout>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} equipment items</p>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add Equipment
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="cards" />
      ) : items.length === 0 ? (
        <EmptyState 
          icon={Wrench} 
          title="No equipment registered" 
          description="Track machinery, tools, and vehicles" 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((eq) => (
            <Card key={eq.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[eq.status ?? "operational"])}>
                      {eq.status}
                    </span>
                    <h3 className="font-semibold text-foreground text-sm">{eq.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{eq.category}</p>
                    {eq.nextMaintenanceDate && (
                      <p className="text-xs text-muted-foreground">Next maint: {String(eq.nextMaintenanceDate).slice(0, 10)}</p>
                    )}
                  </div>
                  {can("write") && (
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditItem(eq)}>Edit</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
          <EquipmentForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Equipment</DialogTitle></DialogHeader>
          {editItem && <EquipmentForm farmId={farmId} item={editItem} onClose={() => setEditItem(null)} />}
        </DialogContent>
      </Dialog>
    </InventoryLayout>
  );
}
