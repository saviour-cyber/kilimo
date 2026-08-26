import { DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";

import { PageHeader } from "@/components/shared/PageHeader";

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
    <div className="px-4 sm:px-6 pt-4 pb-8 space-y-4 max-w-7xl mx-auto">
      <PageHeader 
        title="Finance" 
        description="Income, expenses, and financial reports" 
        icon={DollarSign} 
      />

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
