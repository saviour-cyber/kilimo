import { Package } from "lucide-react";
import { Link, useLocation } from "wouter";

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
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
          <Package className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
          <p className="text-xs text-muted-foreground">Stock, supplies, suppliers, and equipment</p>
        </div>
      </div>

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
