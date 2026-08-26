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
import FinanceLayout from "./FinanceLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const CATEGORIES = {
  income: ["crop_sales", "livestock_sales", "milk_sales", "egg_sales", "grants", "loans", "other_income"],
  expense: ["seeds", "fertilizer", "pesticides", "feed", "labor", "fuel", "equipment", "veterinary", "transport", "utilities", "loan_repayment", "other_expense"],
};

function TransactionForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    type: "expense" as "income" | "expense",
    category: "",
    amount: "",
    description: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash",
    reference: "",
    notes: "",
  });

  const create = trpc.finance.createTransaction.useMutation({
    onSuccess: () => { utils.finance.listTransactions.invalidate(); toast.success("Transaction recorded"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ ...form, farmId, category: form.category as any, paymentMethod: form.paymentMethod as any });
  };

  const cats = CATEGORIES[form.type];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any, category: "" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} required>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {cats.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount *</Label>
          <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
        </div>
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input type="date" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Description *</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" required />
        </div>
        <div className="space-y-1.5">
          <Label>Payment Method</Label>
          <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["cash", "bank_transfer", "mobile_money", "cheque", "other"].map((m) => <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Reference</Label>
          <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Receipt/Invoice #" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || !form.category}>Record Transaction</Button>
      </div>
    </form>
  );
}

export default function Transactions() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: transactions = [], isLoading } = trpc.finance.listTransactions.useQuery(
    { farmId, type: typeFilter === "all" ? undefined : typeFilter as any },
    { enabled: !!farmId }
  );

  const currency = currentFarm?.farm.currency ?? "USD";
  const formatCurrency = (v: string | number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(parseFloat(String(v)));

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(String(t.amount)), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(String(t.amount)), 0);

  return (
    <FinanceLayout>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Income</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Profit</p>
            <p className={cn("text-2xl font-bold mt-1", totalIncome - totalExpense >= 0 ? "text-violet-600" : "text-destructive")}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {["all", "income", "expense"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add Transaction
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="list" />
      ) : transactions.length === 0 ? (
        <EmptyState 
          icon={ArrowDown} 
          title="No transactions yet" 
          description="Record income and expenses to track your farm finances" 
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => {
            const isIncome = t.type === "income";
            return (
              <Card key={t.id} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", isIncome ? "bg-green-100" : "bg-red-100")}>
                      {isIncome ? <ArrowDown className="w-3.5 h-3.5 text-green-600" /> : <ArrowUp className="w-3.5 h-3.5 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(t.transactionDate).slice(0, 10)} · {String(t.category).replace(/_/g, " ")}
                        {t.paymentMethod ? ` · ${String(t.paymentMethod).replace("_", " ")}` : ""}
                      </p>
                    </div>
                    <span className={cn("font-bold text-sm shrink-0", isIncome ? "text-green-600" : "text-red-600")}>
                      {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
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
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <TransactionForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </FinanceLayout>
  );
}
