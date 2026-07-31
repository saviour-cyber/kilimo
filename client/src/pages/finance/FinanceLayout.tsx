import { DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";

const FINANCE_TABS = [
  { label: "Transactions", path: "/finance/transactions" },
  { label: "Budgets", path: "/finance/budgets" },
  { label: "P&L Report", path: "/finance/report" },
  { label: "Budget vs Actual", path: "/finance/budget-vs-actual" },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const active = FINANCE_TABS.find((t) => location.startsWith(t.path))?.path ?? "/finance/transactions";

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Finance</h1>
          <p className="text-xs text-muted-foreground">Income, expenses, and financial reports</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto pb-0">
        {FINANCE_TABS.map((tab) => (
          <Link key={tab.path} href={tab.path}>
            <button
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active === tab.path
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
