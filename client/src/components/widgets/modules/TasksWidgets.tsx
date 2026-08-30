import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, ListTodo } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function TasksKpiWidget({ farmId }: { farmId: number }) {
  const { data, isLoading } = trpc.tasks.dashboardSummary.useQuery({ farmId }, { enabled: !!farmId });
  if (isLoading) return <Skeleton className="h-[100px] rounded-2xl" />;
  const pendingCount = data?.pendingCount ?? 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col h-[100px]">
      <span className="text-[11px] font-semibold text-orange-600 truncate mb-1">Tasks Pending</span>
      <span className="text-[15px] font-bold text-slate-900 truncate flex-1">{pendingCount}</span>
      <CheckSquare className="w-4 h-4 text-orange-500" />
    </div>
  );
}

export function TasksSummaryWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.tasks.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[180px] rounded-xl w-full", className)} />;

  const upcoming = data?.upcomingTasks ?? [];

  return (
    <Card className={cn("border shadow-sm bg-white", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-purple-100">
            <CheckSquare className="w-3.5 h-3.5 text-purple-700" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">Upcoming Tasks</h3>
        </div>
        <Link href="/tasks">
          <span className="text-[11px] font-bold text-muted-foreground hover:text-purple-600 cursor-pointer">View All</span>
        </Link>
      </div>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {upcoming.slice(0, 4).map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 border-b border-slate-50 hover:bg-muted cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded border border-slate-300 bg-white group-hover:border-green-500 flex-shrink-0"></div>
                <span className="text-[12px] font-medium text-muted-foreground">{task.title}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                <span>{task.dueDate ?? "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
