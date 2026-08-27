import { Card, CardContent } from "@/components/ui/card";
import { Tractor } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export function EquipmentKpiWidget({ farmId }: { farmId: number }) {
  const { data, isLoading } = trpc.inventory.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className="h-[100px] rounded-xl" />;
  const total = data?.totalEquipment ?? 0;

  return (
    <Card className="border shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-100">
            <Tractor className="w-4 h-4 text-cyan-700" />
          </div>
          <span className="text-sm font-semibold text-muted-foreground">Equipment</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-foreground">{total}</div>
            <div className="text-xs text-muted-foreground mt-1">Total registered</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EquipmentSummaryWidget({ farmId }: { farmId: number }) {
  const { data, isLoading } = trpc.inventory.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className="h-[280px] rounded-xl w-full" />;

  const total = data?.totalEquipment ?? 0;

  return (
    <Card className="border shadow-sm bg-white flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-cyan-100">
            <Tractor className="w-3.5 h-3.5 text-cyan-700" />
          </div>
          <span className="font-bold text-[14px] text-foreground">Equipment Summary</span>
        </div>
        <span className="text-muted-foreground font-bold text-lg leading-none cursor-pointer">Â·Â·Â·</span>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Equipment</span>
            <span className="font-bold text-foreground">{total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">In Use</span>
            <span className="font-bold text-foreground">â€”</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Needs Service</span>
            <span className="font-bold text-red-500">â€”</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t text-center">
          <a href="/inventory/equipment" className="text-[12px] font-bold text-cyan-600 hover:text-cyan-700">View Equipment â†’</a>
        </div>
      </CardContent>
    </Card>
  );
}
