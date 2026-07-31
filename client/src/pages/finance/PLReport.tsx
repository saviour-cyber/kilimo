import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import FinanceLayout from "./FinanceLayout";

const COLORS = ["#22c55e", "#ef4444", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#14b8a6"];

export default function PLReport() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const { data: summary, isLoading } = trpc.finance.summary.useQuery({ farmId }, { enabled: !!farmId });

  const currency = currentFarm?.farm.currency ?? "USD";
  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);

  if (isLoading) return (
    <FinanceLayout>
      <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
    </FinanceLayout>
  );

  const netProfit = (summary?.totalIncome ?? 0) - (summary?.totalExpense ?? 0);
  const profitMargin = summary?.totalIncome ? (netProfit / summary.totalIncome) * 100 : 0;

  const monthlyData = summary?.byMonth ?? [];
  const categoryData = Object.entries(summary?.byCategory ?? {}).map(([cat, vals]) => ({
    name: cat.replace(/_/g, " "),
    income: (vals as any).income,
    expense: (vals as any).expense,
  })).sort((a, b) => (b.income + b.expense) - (a.income + a.expense)).slice(0, 10);

  const expensePieData = categoryData.filter((c) => c.expense > 0).map((c) => ({ name: c.name, value: c.expense }));

  return (
    <FinanceLayout>
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Income</p>
            <p className="text-xl font-bold text-green-600 mt-1">{fmt(summary?.totalIncome ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Expenses</p>
            <p className="text-xl font-bold text-red-600 mt-1">{fmt(summary?.totalExpense ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Profit</p>
            <div className="flex items-center gap-1.5 mt-1">
              {netProfit > 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : netProfit < 0 ? <TrendingDown className="w-4 h-4 text-red-600" /> : <Minus className="w-4 h-4 text-muted-foreground" />}
              <p className={cn("text-xl font-bold", netProfit > 0 ? "text-green-600" : netProfit < 0 ? "text-red-600" : "text-muted-foreground")}>{fmt(netProfit)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Profit Margin</p>
            <p className={cn("text-xl font-bold mt-1", profitMargin >= 0 ? "text-violet-600" : "text-destructive")}>{profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Monthly Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }}
                  formatter={(v: any) => fmt(v)}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-4">Expense Breakdown</h3>
              {expensePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {expensePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }} formatter={(v: any) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground py-8 text-center">No expense data</p>}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-4">By Category</h3>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {categoryData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-foreground">{c.name}</span>
                    <div className="flex gap-3 text-xs">
                      {c.income > 0 && <span className="text-green-600 font-medium">+{fmt(c.income)}</span>}
                      {c.expense > 0 && <span className="text-red-600 font-medium">-{fmt(c.expense)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!summary?.totalIncome && !summary?.totalExpense && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No financial data yet</p>
          <p className="text-sm mt-1">Add transactions to see your P&L report</p>
        </div>
      )}
    </FinanceLayout>
  );
}
