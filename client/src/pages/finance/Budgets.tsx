import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PiggyBank, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import FinanceLayout from "./FinanceLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

function BudgetForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: "",
    category: "expense",
    type: "expense" as "income" | "expense",
    amount: "",
    period: new Date().getFullYear().toString(),
    season: "",
    notes: "",
  });

  const create = trpc.finance.createBudget.useMutation({
    onSuccess: () => { utils.finance.listBudgets.invalidate(); toast.success("Budget created"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ ...form, farmId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Budget Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Q1 Fertilizer Budget" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. fertilizer" required />
        </div>
        <div className="space-y-1.5">
          <Label>Budgeted Amount *</Label>
          <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
        </div>
        <div className="space-y-1.5">
          <Label>Period (Year) *</Label>
          <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="2025" required />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Season</Label>
          <Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="e.g. Long Rains 2025" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending}>Create Budget</Button>
      </div>
    </form>
  );
}

export default function Budgets() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: budgets = [], isLoading } = trpc.finance.listBudgets.useQuery({ farmId }, { enabled: !!farmId });
  const deleteBudget = trpc.finance.deleteBudget.useMutation({
    onSuccess: () => { trpc.useUtils().finance.listBudgets.invalidate(); toast.success("Budget deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const currency = currentFarm?.farm.currency ?? "USD";
  const fmt = (v: string | number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(parseFloat(String(v)));

  return (
    <FinanceLayout>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{budgets.length} budgets</p>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Create Budget
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="cards" />
      ) : budgets.length === 0 ? (
        <EmptyState 
          icon={PiggyBank} 
          title="No budgets created" 
          description="Create income and expense budgets to plan your farm finances" 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <Card key={b.id} className="border-0 shadow-sm">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{b.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{b.type} · {b.category} · {b.period}</p>
                    {b.season && <p className="text-xs text-muted-foreground">{b.season}</p>}
                  </div>
                  {can("manage") && (
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={() => deleteBudget.mutate({ budgetId: b.id, farmId })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className={cn("text-xl font-bold", b.type === "income" ? "text-green-600" : "text-red-600")}>
                  {fmt(b.amount)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
          <BudgetForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </FinanceLayout>
  );
}
