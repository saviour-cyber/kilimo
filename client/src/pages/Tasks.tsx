import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-red-600 text-white",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Circle className="w-4 h-4 text-muted-foreground" />,
  in_progress: <Clock className="w-4 h-4 text-amber-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  cancelled: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
};

function TaskForm({ farmId, task, onClose }: { farmId: number; task?: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    category: task?.category ?? "general",
    priority: task?.priority ?? "medium",
    dueDate: task?.dueDate ? String(task.dueDate).slice(0, 10) : "",
    status: task?.status ?? "pending",
    notes: task?.notes ?? "",
  });

  const create = trpc.tasks.create.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task created"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  const update = trpc.tasks.update.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task updated"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) update.mutate({ ...form, taskId: task.id, farmId, priority: form.priority as any, status: form.status as any } as any);
    else create.mutate({ ...form, farmId, priority: form.priority as any } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Task Title *</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Vaccinate herd" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["general", "livestock", "crops", "maintenance", "finance"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["low", "medium", "high", "critical"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["pending", "in_progress", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {task ? "Update" : "Create"} Task
        </Button>
      </div>
    </form>
  );
}

export default function Tasks() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: tasks = [], isLoading } = trpc.tasks.list.useQuery(
    { farmId, status: statusFilter === "all" ? undefined : statusFilter as any },
    { enabled: !!farmId }
  );

  const utils = trpc.useUtils();
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
    onError: (e: any) => toast.error(e.message),
  });

  const toggleComplete = (task: any) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateTask.mutate({ taskId: task.id, farmId, status: newStatus as any } as any);
  };

  const overdue = (tasks as any[]).filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed" && t.status !== "cancelled");

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
      <PageHeader 
        title="Tasks" 
        description="Farm activity management"
        icon={CheckCircle2}
        iconColor="text-amber-600"
        iconBg="bg-amber-100"
      />

      <div className="max-w-4xl space-y-4">
        {overdue.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span><strong>{overdue.length}</strong> overdue task{overdue.length > 1 ? "s" : ""}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "in_progress", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                  statusFilter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-muted-foreground hover:bg-muted border-border"
                )}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
          {can("write") && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />Add Task
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingSkeleton variant="list" />
        ) : tasks.length === 0 ? (
          <EmptyState 
            icon={CheckCircle2} 
            title="No tasks" 
            description="Create tasks to manage your farm activities" 
          />
        ) : (
          <div className="space-y-2">
            {(tasks as any[]).map((task: any) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed" && task.status !== "cancelled";
              return (
                <Card key={task.id} className={cn("border-0 shadow-sm hover:shadow-md transition-shadow", task.status === "completed" && "opacity-60")}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <button onClick={() => can("write") && toggleComplete(task)} className="mt-0.5 shrink-0 hover:scale-110 transition-transform">
                        {STATUS_ICONS[task.status ?? "pending"]}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className={cn("font-semibold text-sm text-foreground", task.status === "completed" && "line-through text-muted-foreground")}>
                            {task.title}
                          </p>
                          <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium", PRIORITY_STYLES[task.priority ?? "medium"])}>
                            {task.priority}
                          </span>
                          {isOverdue && <Badge variant="destructive" className="text-[10px] uppercase tracking-wider py-0 px-1.5 h-5">Overdue</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="capitalize">{task.category}</span>
                          {task.dueDate ? ` Â· Due: ${String(task.dueDate).slice(0, 10)}` : ""}
                        </p>
                        {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 border-t border-border pt-1">{task.description}</p>}
                      </div>
                      {can("write") && (
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditTask(task)}>Edit</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
          <TaskForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          {editTask && <TaskForm farmId={farmId} task={editTask} onClose={() => setEditTask(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
