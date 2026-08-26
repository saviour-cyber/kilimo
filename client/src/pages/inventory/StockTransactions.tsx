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
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import InventoryLayout from "./InventoryLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

function TransactionForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: items = [] } = trpc.inventory.listItems.useQuery({ farmId });
  const [form, setForm] = useState({
    itemId: "",
    transactionType: "stock_in" as const,
    quantity: "",
    unitCost: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });

  const create = trpc.inventory.recordTransaction.useMutation({
    onSuccess: () => { utils.inventory.listTransactions.invalidate(); utils.inventory.listItems.invalidate(); toast.success("Transaction recorded"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      farmId,
      itemId: parseInt(form.itemId),
      transactionType: form.transactionType,
      quantity: form.quantity,
      unitCost: form.unitCost || undefined,
      transactionDate: form.transactionDate,
      referenceNumber: form.reference || undefined,
      reason: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Item *</Label>
          <Select value={form.itemId} onValueChange={(v) => setForm({ ...form, itemId: v })} required>
            <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
            <SelectContent>
              {items.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name} ({i.currentStock} {i.unit})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Transaction Type</Label>
          <Select value={form.transactionType} onValueChange={(v) => setForm({ ...form, transactionType: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="stock_in">Stock In</SelectItem>
              <SelectItem value="stock_out">Stock Out</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input type="date" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Quantity *</Label>
          <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" required />
        </div>
        <div className="space-y-1.5">
          <Label>Unit Cost</Label>
          <Input type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} placeholder="0.00" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Reference</Label>
          <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Invoice/PO number" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || !form.itemId}>Record Transaction</Button>
      </div>
    </form>
  );
}

export default function StockTransactions() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: transactions = [], isLoading } = trpc.inventory.listTransactions.useQuery({ farmId }, { enabled: !!farmId });

  return (
    <InventoryLayout>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{transactions.length} transactions</p>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Record Transaction
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="list" />
      ) : transactions.length === 0 ? (
        <EmptyState 
          icon={ArrowDown} 
          title="No transactions yet" 
          description="Record stock movements to track your inventory" 
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => {
            const isIn = t.transactionType === "stock_in";
            return (
              <Card key={t.id} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", isIn ? "bg-green-100" : "bg-red-100")}>
                      {isIn ? <ArrowDown className="w-3.5 h-3.5 text-green-600" /> : <ArrowUp className="w-3.5 h-3.5 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">Item #{t.itemId} · <span className="capitalize">{t.transactionType.replace("_", " ")}</span></p>
                      <p className="text-xs text-muted-foreground">{String(t.transactionDate).slice(0, 10)}{t.referenceNumber ? ` · ${t.referenceNumber}` : ""}</p>
                    </div>
                    <span className={cn("font-bold text-sm", isIn ? "text-green-600" : "text-red-600")}>
                      {isIn ? "+" : "-"}{t.quantity}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Stock Transaction</DialogTitle></DialogHeader>
          <TransactionForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </InventoryLayout>
  );
}
