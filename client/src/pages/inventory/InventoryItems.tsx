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
import { AlertTriangle, Package, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import InventoryLayout from "./InventoryLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const CATEGORY_COLORS: Record<string, string> = {
  seeds: "bg-green-100 text-green-700",
  fertilizer: "bg-lime-100 text-lime-700",
  pesticide: "bg-red-100 text-red-700",
  herbicide: "bg-orange-100 text-orange-700",
  feed: "bg-amber-100 text-amber-700",
  medicine: "bg-blue-100 text-blue-700",
  fuel: "bg-slate-100 text-slate-600",
  other: "bg-muted text-muted-foreground",
};

function ItemForm({ farmId, item, onClose }: { farmId: number; item?: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: item?.name ?? "",
    category: item?.category ?? "other",
    unit: item?.unit ?? "kg",
    currentStock: item?.currentStock ? String(item.currentStock) : "0",
    minimumStock: item?.minimumStock ? String(item.minimumStock) : "",
    costPerUnit: item?.costPerUnit ? String(item.costPerUnit) : "",
    supplierId: item?.supplierId ? String(item.supplierId) : "",
    notes: item?.notes ?? "",
  });

  const { data: suppliers = [] } = trpc.inventory.listSuppliers.useQuery({ farmId });

  const create = trpc.inventory.createItem.useMutation({
    onSuccess: () => { utils.inventory.listItems.invalidate(); toast.success("Item created"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  const update = trpc.inventory.updateItem.useMutation({
    onSuccess: () => { utils.inventory.listItems.invalidate(); toast.success("Item updated"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      farmId,
      supplierId: form.supplierId && form.supplierId !== "none" ? parseInt(form.supplierId) : undefined,
      category: form.category as any,
    };
    if (item) update.mutate({ ...payload, itemId: item.id });
    else create.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Item Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. DAP Fertilizer" required />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["seed","fertilizer","pesticide","herbicide","feed","medicine","fuel","equipment","packaging","other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["kg", "g", "litres", "ml", "bags", "pieces", "bales", "tonnes"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Current Stock</Label>
          <Input type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Minimum Stock (Alert)</Label>
          <Input type="number" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Cost per Unit</Label>
          <Input type="number" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>Supplier</Label>
          <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
            <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
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
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {item ? "Update" : "Create"} Item
        </Button>
      </div>
    </form>
  );
}

export default function InventoryItems() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: items = [], isLoading } = trpc.inventory.listItems.useQuery({ farmId }, { enabled: !!farmId });

  const filtered = categoryFilter === "all" ? items : items.filter((i) => i.category === categoryFilter);
  const lowStockItems = items.filter((i) => i.minimumStock && parseFloat(String(i.currentStock)) <= parseFloat(String(i.minimumStock)));

  return (
    <InventoryLayout>
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>{lowStockItems.length}</strong> item{lowStockItems.length > 1 ? "s" : ""} below minimum stock: {lowStockItems.map((i) => i.name).join(", ")}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {["all", ...Object.keys(CATEGORY_COLORS)].map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add Item
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="cards" />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={Package} 
          title="No items found" 
          description="Add inventory items to track stock levels" 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isLow = item.minimumStock && parseFloat(String(item.currentStock)) <= parseFloat(String(item.minimumStock));
            return (
              <Card key={item.id} className={cn("border-0 shadow-sm hover:shadow-md transition-shadow", isLow && "ring-1 ring-amber-400")}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium", CATEGORY_COLORS[item.category ?? "other"])}>
                          {item.category}
                        </span>
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-xl font-bold", isLow ? "text-amber-600" : "text-foreground")}>
                          {item.currentStock}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.unit}</span>
                      </div>
                      {item.minimumStock && (
                        <p className="text-xs text-muted-foreground">Min: {item.minimumStock} {item.unit}</p>
                      )}
                    </div>
                    {can("write") && (
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditItem(item)}>Edit</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
          <ItemForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
          {editItem && <ItemForm farmId={farmId} item={editItem} onClose={() => setEditItem(null)} />}
        </DialogContent>
      </Dialog>
    </InventoryLayout>
  );
}
