import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MODULE_COLORS: Record<string, string> = {
  crop: "bg-green-500",
  livestock: "bg-amber-500",
  finance: "bg-orange-400",
  inventory: "bg-blue-500",
  task: "bg-purple-500",
};

export function ActivityFeedWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data: activity, isLoading } = trpc.dashboard.recentActivity.useQuery(
    { farmId, limit: 6 },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[220px] rounded-xl w-full", className)} />;

  const items = activity || [];

  return (
    <Card className={cn("border shadow-sm bg-white flex flex-col", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-100">
            <Clock className="w-3.5 h-3.5 text-slate-700" />
          </div>
          <span className="font-bold text-[13px] text-slate-800">Recent Activity</span>
        </div>
        <Link href="/notifications">
          <span className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">View All</span>
        </Link>
      </div>
      <CardContent className="p-0 flex flex-col py-1">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-slate-400 text-center">No recent activity</div>
        ) : (
          items.map((item) => {
            const colorClass = MODULE_COLORS[item.entityType ?? ""] ?? "bg-slate-400";
            return (
              <div key={item.id} className="flex items-start justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colorClass}`} />
                  <span className="text-[12px] font-medium text-slate-700 leading-snug">
                    {item.description ?? item.action}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 mt-0.5">
                  {new Date(String(item.createdAt)).toLocaleDateString()}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
