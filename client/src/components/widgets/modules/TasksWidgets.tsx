import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, ListTodo } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function TasksKpiWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.tasks.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[90px] rounded-xl", className)} />;
  
  const pendingCount = data?.pendingCount ?? 0;

  return (
    <Card className={cn("border shadow-sm bg-white", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-100 shrink-0">
            <CheckSquare className="w-4 h-4 text-orange-700" />
          </div>
          <span className="text-sm font-semibold text-muted-foreground truncate">Pending Tasks</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Awaiting action</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TasksSummaryWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.tasks.dashboardSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[250px] rounded-xl w-full", className)} />;

  const pending = data?.pendingCount ?? 0;
  const inProgress = data?.inProgressCount ?? 0;
  const overdue = data?.overdueCount ?? 0;

  return (
    <Card className={cn("border shadow-sm bg-white flex flex-col", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-orange-100">
            <ListTodo className="w-3.5 h-3.5 text-orange-700" />
          </div>
          <span className="font-bold text-[13px] text-foreground">Tasks Overview</span>
        </div>
        <Link href="/tasks">
          <span className="text-[11px] font-bold text-muted-foreground hover:text-orange-600 cursor-pointer">View All</span>
        </Link>
      </div>
      
      <CardContent className="p-4 flex flex-col gap-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-2.5 border border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">In Progress</div>
            <div className="text-lg font-bold text-foreground leading-none">{inProgress}</div>
          </div>
          <div className="bg-muted rounded-lg p-2.5 border border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pending</div>
            <div className="text-lg font-bold text-foreground leading-none">{pending}</div>
          </div>
        </div>

        {/* Alerts List */}
        {overdue > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-medium text-red-700 bg-red-50 p-1.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {overdue} task{overdue > 1 ? "s are" : " is"} overdue!
            </div>
          </div>
        )}

        {/* Embedded Quick Actions */}
        <div className="mt-1">
          <Link href="/tasks">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-orange-50 text-orange-700 text-[11px] font-bold rounded-md hover:bg-orange-100 transition-colors">
              <CheckSquare className="w-3 h-3" /> Create Task
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function TasksUpcomingSidebarWidget({ farmId, className }: { farmId: number; className?: string }) {
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
          <span className="font-bold text-[13px] text-foreground">Upcoming Tasks</span>
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
                <span>{task.dueDate ?? "â€”"}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
