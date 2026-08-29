import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import {
  Users,
  UserCheck,
  UserMinus,
  AlertCircle,
  CheckSquare,
  Clock,
  CalendarCheck,
  XCircle,
  Activity,
} from "lucide-react";
import { format, isToday, parseISO, formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

const STATUS_DOT: Record<string, string> = {
  present: "bg-emerald-500",
  absent: "bg-red-500",
  half_day: "bg-amber-500",
  on_leave: "bg-blue-500",
};

const TASK_STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  completed: { dot: "bg-emerald-500", label: "Completed" },
  in_progress: { dot: "bg-blue-500", label: "In progress" },
  pending: { dot: "bg-slate-400", label: "Pending" },
  cancelled: { dot: "bg-red-400", label: "Cancelled" },
};

export default function WorkersOverview() {
  const { currentFarm } = useFarm();
  const [, setLocation] = useLocation();
  const farmId = currentFarm?.farm.id;

  const { data: workers = [] } = trpc.workers.listWorkers.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const { data: attendance = [] } = trpc.workers.listAttendance.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const { data: allTasks = [] } = trpc.tasks.list.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const { data: teams = [] } = trpc.workers.listTeams.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  // ── Counters ──────────────────────────────────────────────────────────────
  const activeCount = workers.filter((w: any) => w.status === "active").length;
  const onLeaveCount = workers.filter((w: any) => w.status === "on_leave").length;
  const inactiveCount = workers.filter(
    (w: any) => w.status === "inactive" || w.status === "terminated"
  ).length;

  // Today's attendance snapshot
  const todayAttendance = attendance.filter((a: any) => {
    try { return isToday(parseISO(String(a.date))); } catch { return false; }
  });
  const presentToday = todayAttendance.filter((a: any) => a.status === "present").length;
  const absentToday = todayAttendance.filter((a: any) => a.status === "absent").length;

  // Worker lookup map
  const workerMap = workers.reduce((acc: any, w: any) => {
    acc[w.id] = w;
    return acc;
  }, {});

  // ── Activity feed: merge attendance + tasks, sort by date desc ─────────────
  type FeedItem = {
    key: string;
    time: Date;
    icon: "attendance" | "task_done" | "task_started" | "task_assigned";
    label: string;
    sub: string;
    color: string;
  };

  const feed: FeedItem[] = [];

  // Last 20 attendance records
  attendance.slice(0, 20).forEach((a: any) => {
    const w = workerMap[a.workerId];
    if (!w) return;
    let label = "";
    let color = "text-muted-foreground";
    if (a.status === "present") { label = "marked present"; color = "text-emerald-600"; }
    else if (a.status === "absent") { label = "was absent"; color = "text-red-500"; }
    else if (a.status === "half_day") { label = "worked half day"; color = "text-amber-600"; }
    else if (a.status === "on_leave") { label = "on leave"; color = "text-blue-500"; }
    try {
      feed.push({
        key: `att-${a.id}`,
        time: parseISO(String(a.date)),
        icon: "attendance",
        label: `${w.firstName} ${w.lastName} ${label}`,
        sub: a.notes || format(parseISO(String(a.date)), "MMM d, yyyy"),
        color,
      });
    } catch { /* skip invalid dates */ }
  });

  // Tasks with a worker assigned — completed, in-progress, pending
  allTasks
    .filter((t: any) => t.assignedToWorkerId)
    .slice(0, 30)
    .forEach((t: any) => {
      const w = workerMap[t.assignedToWorkerId];
      if (!w) return;
      const style = TASK_STATUS_STYLE[t.status] ?? TASK_STATUS_STYLE.pending;
      const timeRaw = t.completedAt || t.updatedAt || t.createdAt;
      let time: Date;
      try { time = new Date(String(timeRaw)); } catch { return; }
      if (isNaN(time.getTime())) return;

      let icon: FeedItem["icon"] = "task_assigned";
      if (t.status === "completed") icon = "task_done";
      else if (t.status === "in_progress") icon = "task_started";

      feed.push({
        key: `task-${t.id}`,
        time,
        icon,
        label: `${w.firstName} ${w.lastName} — ${t.title}`,
        sub: style.label,
        color:
          t.status === "completed"
            ? "text-emerald-600"
            : t.status === "in_progress"
            ? "text-blue-500"
            : "text-muted-foreground",
      });
    });

  // Sort newest first
  feed.sort((a, b) => b.time.getTime() - a.time.getTime());
  const recentFeed = feed.slice(0, 15);

  // ── Tasks summary ─────────────────────────────────────────────────────────
  const workerTasks = allTasks.filter((t: any) => t.assignedToWorkerId);
  const completedTasks = workerTasks.filter((t: any) => t.status === "completed").length;
  const inProgressTasks = workerTasks.filter((t: any) => t.status === "in_progress").length;
  const pendingTasks = workerTasks.filter((t: any) => t.status === "pending").length;

  // Icon renderer
  const FeedIcon = ({ icon, color }: { icon: FeedItem["icon"]; color: string }) => {
    const cls = `w-4 h-4 ${color}`;
    if (icon === "task_done") return <CheckSquare className={cls} />;
    if (icon === "task_started") return <Clock className={cls} />;
    if (icon === "task_assigned") return <Activity className={cls} />;
    return <CalendarCheck className={cls} />;
  };

  return (
    <div className="space-y-6">
      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold">{workers.length}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <UserCheck className="w-4 h-4" />
            <span className="text-xs font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">On Leave</span>
          </div>
          <p className="text-2xl font-bold">{onLeaveCount}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserMinus className="w-4 h-4" />
            <span className="text-xs font-medium">Inactive</span>
          </div>
          <p className="text-2xl font-bold">{inactiveCount}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <CalendarCheck className="w-4 h-4" />
            <span className="text-xs font-medium">Present Today</span>
          </div>
          <p className="text-2xl font-bold">{presentToday}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Absent Today</span>
          </div>
          <p className="text-2xl font-bold">{absentToday}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Activity Feed ── */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Recent Activity
          </h3>

          {recentFeed.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No activity yet. Record attendance or assign tasks to workers to see activity here.
            </div>
          ) : (
            <div className="space-y-1">
              {recentFeed.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0"
                >
                  <div className="mt-0.5 shrink-0">
                    <FeedIcon icon={item.icon} color={item.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                    {formatDistanceToNow(item.time, { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">
          {/* Task summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <CheckSquare className="w-4 h-4 text-primary" />
              Farm Work Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed tasks</span>
                <span className="font-semibold text-emerald-600">{completedTasks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">In progress</span>
                <span className="font-semibold text-blue-500">{inProgressTasks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold">{pendingTasks}</span>
              </div>
              {workerTasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.round((completedTasks / workerTasks.length) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((completedTasks / workerTasks.length) * 100)}% completion rate
                  </p>
                </div>
              )}
            </div>
            <button
              className="mt-3 text-xs text-primary hover:underline w-full text-left"
              onClick={() => setLocation("/workers/assignments")}
            >
              View all assignments →
            </button>
          </div>

          {/* Teams summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              Teams ({teams.length})
            </h3>
            {teams.length === 0 ? (
              <p className="text-xs text-muted-foreground">No teams created yet.</p>
            ) : (
              <div className="space-y-2">
                {teams.slice(0, 5).map((t: any) => {
                  const count = workers.filter((w: any) => w.teamId === t.id).length;
                  return (
                    <div key={t.id} className="flex justify-between items-center text-sm">
                      <span className="truncate text-muted-foreground">{t.name}</span>
                      <span className="font-semibold shrink-0 ml-2">{count} workers</span>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              className="mt-3 text-xs text-primary hover:underline w-full text-left"
              onClick={() => setLocation("/workers/teams")}
            >
              Manage teams →
            </button>
          </div>

          {/* Today's attendance snapshot */}
          {todayAttendance.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-primary" />
                Today's Attendance
              </h3>
              <div className="space-y-1.5">
                {todayAttendance.slice(0, 6).map((a: any) => {
                  const w = workerMap[a.workerId];
                  if (!w) return null;
                  return (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[a.status] ?? "bg-slate-400"}`}
                      />
                      <span className="truncate">
                        {w.firstName} {w.lastName}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground capitalize shrink-0">
                        {a.status.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
                {todayAttendance.length > 6 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    +{todayAttendance.length - 6} more
                  </p>
                )}
              </div>
              <button
                className="mt-3 text-xs text-primary hover:underline w-full text-left"
                onClick={() => setLocation("/workers/attendance")}
              >
                View full attendance →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
