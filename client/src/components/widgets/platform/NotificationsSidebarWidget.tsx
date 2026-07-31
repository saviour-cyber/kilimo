import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function NotificationsSidebarWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data: items = [], isLoading } = trpc.notifications.list.useQuery(
    { farmId, unreadOnly: false },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[220px] rounded-xl w-full", className)} />;

  const recent = items.slice(0, 5);
  const unreadCount = items.filter(n => !n.isRead).length;

  return (
    <Card className={cn("border shadow-sm bg-white flex flex-col", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-rose-50">
            <Bell className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="font-bold text-[13px] text-slate-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ml-1">
              {unreadCount}
            </span>
          )}
        </div>
        <Link href="/notifications">
          <span className="text-[11px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer">View All</span>
        </Link>
      </div>
      <CardContent className="p-0 flex flex-col py-1">
        {recent.length === 0 ? (
          <div className="p-4 text-sm text-slate-400 text-center">No notifications</div>
        ) : (
          recent.map(n => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 transition-colors cursor-pointer hover:bg-slate-50",
                !n.isRead ? "bg-rose-50/30" : ""
              )}
            >
              <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", !n.isRead ? "bg-rose-500" : "bg-slate-300")} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium leading-tight text-slate-700 truncate">{n.title}</p>
                {n.message && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.message}</p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
