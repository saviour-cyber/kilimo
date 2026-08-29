import { Card, CardContent } from "@/components/ui/card";
import { Package, Tractor, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function InventoryKpiWidget({ farmId }: { farmId: number }) {
  const { data, isLoading } = trpc.inventory.dashboardSummary.useQuery({ farmId }, { enabled: !!farmId });
  if (isLoading) return <Skeleton className="h-[100px] rounded-2xl" />;
  const lowStock = data?.lowStockCount ?? 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-red-100 shadow-sm flex flex-col h-[100px]">
      <span className="text-[11px] font-semibold text-red-600 truncate mb-1">Stock Alerts</span>
      <span className="text-[15px] font-bold text-slate-900 truncate flex-1">{lowStock}</span>
      <AlertTriangle className="w-4 h-4 text-red-500" />
    </div>
  );
}

export function InventorySummaryWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.inventory.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[250px] rounded-xl w-full", className)} />;

  const lowStock = data?.lowStockCount ?? 0;
  const totalItems = data?.totalItems ?? 0;
  const lowStockAlerts = data?.lowStockAlerts ?? [];

  return (
    <Card className={cn("border shadow-sm bg-white flex flex-col", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-100">
            <Package className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <span className="font-bold text-[13px] text-foreground">Inventory Overview</span>
        </div>
        <Link href="/inventory">
          <span className="text-[11px] font-bold text-muted-foreground hover:text-blue-600 cursor-pointer">View All</span>
        </Link>
      </div>
      
      <CardContent className="p-4 flex flex-col gap-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-2.5 border border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Items</div>
            <div className="text-lg font-bold text-foreground leading-none">{totalItems}</div>
          </div>
          <div className="bg-muted rounded-lg p-2.5 border border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Low Stock</div>
            <div className={`text-lg font-bold leading-none ${lowStock > 0 ? "text-red-600" : "text-foreground"}`}>
              {lowStock}
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {lowStockAlerts.length > 0 && (
          <div className="space-y-1.5">
            {lowStockAlerts.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-[11px] font-medium text-red-700 bg-red-50 p-1.5 rounded">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span className="truncate">{item.name} is running low</span>
                </div>
                <span className="font-bold ml-2 shrink-0">{item.currentStock} {item.unit} left</span>
              </div>
            ))}
          </div>
        )}

        {/* Embedded Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Link href="/inventory/items">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md hover:bg-blue-100 transition-colors">
              <Package className="w-3 h-3" /> Add Item
            </button>
          </Link>
          <Link href="/inventory/equipment">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-sky-50 text-sky-700 text-[11px] font-bold rounded-md hover:bg-sky-100 transition-colors">
              <Tractor className="w-3 h-3" /> Log Equipment
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
