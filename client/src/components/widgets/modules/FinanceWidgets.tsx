import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Wallet, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function FinanceRevenueKpiWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.finance.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[90px] rounded-xl", className)} />;
  
  const revenue = data?.totalIncome ?? 0;

  return (
    <Card className={cn("border shadow-sm bg-white", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-100 shrink-0">
            <Wallet className="w-4 h-4 text-blue-700" />
          </div>
          <span className="text-sm text-slate-600 truncate">
            <span className="font-semibold">Revenue</span>{" "}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold text-slate-900">KES {revenue.toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceExpenseKpiWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.finance.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[90px] rounded-xl", className)} />;
  
  const expenses = data?.totalExpense ?? 0;

  return (
    <Card className={cn("border shadow-sm bg-white", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-100 shrink-0">
            <DollarSign className="w-4 h-4 text-purple-700" />
          </div>
          <span className="text-sm text-slate-600 truncate">
            <span className="font-semibold">Expenses</span>{" "}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold text-slate-900">KES {expenses.toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceSummaryWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.finance.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[250px] rounded-xl w-full", className)} />;

  const income = data?.totalIncome ?? 0;
  const expenses = data?.totalExpense ?? 0;
  const profit = data?.netProfit ?? 0;
  const margin = income > 0 ? Math.round((profit / income) * 100) : 0;

  return (
    <Card className={cn("border shadow-sm bg-white flex flex-col", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-violet-100">
            <DollarSign className="w-3.5 h-3.5 text-violet-700" />
          </div>
          <span className="font-bold text-[13px] text-slate-800">Finance Overview</span>
        </div>
        <Link href="/finance">
          <span className="text-[11px] font-bold text-slate-400 hover:text-violet-600 cursor-pointer">View All</span>
        </Link>
      </div>
      
      <CardContent className="p-4 flex flex-col gap-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Net Profit</div>
            <div className={`text-lg font-bold leading-none ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>
              KES {profit.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Profit Margin</div>
            <div className="text-lg font-bold text-slate-900 leading-none">{margin}%</div>
          </div>
        </div>

        {/* Embedded Chart */}
        <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
          <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>Income</span>
            <span>Expenses</span>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="font-bold text-green-600 text-sm">KES {income.toLocaleString()}</span>
            <div className="h-0.5 w-8 bg-slate-200 mx-2 rounded-full" />
            <span className="font-bold text-red-500 text-sm">KES {expenses.toLocaleString()}</span>
          </div>
        </div>

        {/* Embedded Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Link href="/finance/transactions">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-violet-50 text-violet-700 text-[11px] font-bold rounded-md hover:bg-violet-100 transition-colors">
              <DollarSign className="w-3 h-3" /> Record Entry
            </button>
          </Link>
          <Link href="/finance/report">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-md hover:bg-purple-100 transition-colors">
              <TrendingUp className="w-3 h-3" /> P&L Report
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
