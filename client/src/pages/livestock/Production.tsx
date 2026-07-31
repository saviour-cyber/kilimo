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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Droplets, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";

function ProductionForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: animals = [] } = trpc.livestock.listAnimals.useQuery({ farmId, status: "active" });
  const [form, setForm] = useState({
    animalId: "",
    productType: "milk" as const,
    quantity: "",
    unit: "litres",
    productionDate: new Date().toISOString().slice(0, 10),
    quality: "",
    notes: "",
  });

  const create = trpc.livestock.createProduction.useMutation({
    onSuccess: () => { utils.livestock.listProduction.invalidate(); toast.success("Production recorded"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      farmId,
      animalId: form.animalId && form.animalId !== "all" ? parseInt(form.animalId) : undefined,
      productType: form.productType,
      quantity: form.quantity,
      unit: form.unit,
      recordDate: form.productionDate,
      quality: (form.quality as any) || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Animal</Label>
          <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })}>
            <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Herd total</SelectItem>
              {animals.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name ?? a.tagNumber ?? `${a.species} #${a.id}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Product Type</Label>
          <Select value={form.productType} onValueChange={(v) => setForm({ ...form, productType: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["milk", "eggs", "wool", "honey", "other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Production Date *</Label>
          <Input type="date" value={form.productionDate} onChange={(e) => setForm({ ...form, productionDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Quantity *</Label>
          <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" required />
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["litres", "kg", "pieces", "grams"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Quality</Label>
          <Input value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })} placeholder="e.g. Grade A" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending}>Record</Button>
      </div>
    </form>
  );
}

export default function Production() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: records = [], isLoading } = trpc.livestock.listProduction.useQuery({ farmId }, { enabled: !!farmId });

  const chartData = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const r of records as any[]) {
      const d = String(r.recordDate ?? r.productionDate).slice(0, 10);
      byDate[d] = (byDate[d] ?? 0) + (parseFloat(String(r.quantity)) || 0);
    }
    return Object.entries(byDate).slice(-14).map(([date, total]) => ({ date: date.slice(5), total }));
  }, [records]);

  const totalProduction = records.reduce((s: number, r: any) => s + (parseFloat(String(r.quantity)) || 0), 0);

  return (
    <LivestockLayout>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{records.length} records · Total: <span className="font-semibold text-foreground">{totalProduction.toFixed(1)}</span></p>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Record Production
          </Button>
        )}
      </div>

      {chartData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-3">Last 14 Days</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }} />
                <Bar dataKey="total" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} name="Production" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Droplets className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No production records</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.slice(0, 30).map((r) => (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm text-foreground capitalize">{r.productType}</p>
                    <p className="text-xs text-muted-foreground">{String((r as any).recordDate ?? (r as any).productionDate).slice(0, 10)}{r.quality ? ` · ${r.quality}` : ""}</p>
                  </div>
                  <span className="font-bold text-foreground">{r.quantity} {r.unit}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Production</DialogTitle></DialogHeader>
          <ProductionForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </LivestockLayout>
  );
}
