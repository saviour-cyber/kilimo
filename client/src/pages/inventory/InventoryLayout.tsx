import { Package } from "lucide-react";
import { Link, useLocation } from "wouter";

import { PageHeader } from "@/components/shared/PageHeader";

const INVENTORY_TABS = [
  { label: "Items", path: "/inventory/items" },
  { label: "Stock Transactions", path: "/inventory/transactions" },
  { label: "Suppliers", path: "/inventory/suppliers" },
  { label: "Equipment", path: "/inventory/equipment" },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const active = INVENTORY_TABS.find((t) => location.startsWith(t.path))?.path ?? "/inventory/items";

  return (
    <div className="px-4 sm:px-6 pt-4 pb-8 space-y-4 max-w-7xl mx-auto">
      <PageHeader 
        title="Inventory" 
        description="Stock, supplies, suppliers, and equipment" 
        icon={Package} 
      />

      <div className="flex gap-1 border-b border-border overflow-x-auto pb-0">
        {INVENTORY_TABS.map((tab) => (
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
