import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import FinanceLayout from "./FinanceLayout";

export default function BudgetVsActual() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [period, setPeriod] = useState(new Date().getFullYear().toString());

  const { data: budgets = [], isLoading } = trpc.finance.budgetVsActual.useQuery(
    { farmId, period },
    { enabled: !!farmId }
  );

  const currency = currentFarm?.farm.currency ?? "USD";
  const fmt = (v: number | string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(parseFloat(String(v)));

  const incomeData = (budgets as any[]).filter((b: any) => b.type === "income");
  const expenseData = (budgets as any[]).filter((b: any) => b.type === "expense");

  const totalBudgetIncome = incomeData.reduce((sum, b) => sum + parseFloat(String(b.amount)), 0);
  const totalActualIncome = incomeData.reduce((sum, b) => sum + (b.actual ?? 0), 0);
  const totalBudgetExpense = expenseData.reduce((sum, b) => sum + parseFloat(String(b.amount)), 0);
  const totalActualExpense = expenseData.reduce((sum, b) => sum + (b.actual ?? 0), 0);

  const incomeVariance = totalActualIncome - totalBudgetIncome;
  const expenseVariance = totalBudgetExpense - totalActualExpense;

  const chartData = (budgets as any[]).map((b: any) => ({
    category: b.category.replace(/_/g, " "),
    budget: parseFloat(String(b.amount)),
    actual: b.actual ?? 0,
    variance: b.variance ?? 0,
  }));

  return (
    <FinanceLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Budget vs. Actual</h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-medium">No budgets for this period</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Budget Income</p>
                  <p className="text-lg font-bold text-green-600 mt-1">{fmt(totalBudgetIncome)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Actual Income</p>
                  <p className="text-lg font-bold text-green-600 mt-1">{fmt(totalActualIncome)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Budget Expense</p>
                  <p className="text-lg font-bold text-red-600 mt-1">{fmt(totalBudgetExpense)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Actual Expense</p>
                  <p className="text-lg font-bold text-red-600 mt-1">{fmt(totalActualExpense)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Variance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Income Variance</p>
                  <div className="flex items-center gap-2">
                    {incomeVariance > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className={cn("text-2xl font-bold", incomeVariance >= 0 ? "text-green-600" : "text-red-600")}>
                      {fmt(Math.abs(incomeVariance))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {incomeVariance > 0 ? "Above budget" : "Below budget"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Expense Variance</p>
                  <div className="flex items-center gap-2">
                    {expenseVariance > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className={cn("text-2xl font-bold", expenseVariance >= 0 ? "text-green-600" : "text-red-600")}>
                      {fmt(Math.abs(expenseVariance))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {expenseVariance > 0 ? "Under budget" : "Over budget"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">Budget vs Actual by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }}
                        formatter={(v: any) => fmt(v)}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="budget" name="Budget" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="actual" name="Actual" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Detailed Table */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-4">Detailed Breakdown</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(budgets as any[]).map((b: any) => {
                    const variance = b.variance ?? 0;
                    const isUnderBudget = b.type === "expense" ? variance > 0 : variance > 0;
                    return (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-foreground capitalize">{b.category.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">{b.type}</p>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Budget</p>
                            <p className="font-medium text-foreground">{fmt(b.amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className="font-medium text-foreground">{fmt(b.actual ?? 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Variance</p>
                            <p className={cn("font-medium", isUnderBudget ? "text-green-600" : "text-red-600")}>
                              {isUnderBudget ? "+" : "-"}{fmt(Math.abs(variance))}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </FinanceLayout>
  );
}
