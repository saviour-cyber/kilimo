import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-red-600 text-white",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Circle className="w-4 h-4 text-muted-foreground" />,
  in_progress: <Clock className="w-4 h-4 text-amber-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  cancelled: <AlertCircle className="w-4 h-4 text-slate-400" />,
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
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Apply fertilizer to Field A" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["general", "planting", "harvesting", "irrigation", "spraying", "feeding", "veterinary", "maintenance", "other"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
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
        {task && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["pending", "in_progress", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>{task ? "Update" : "Create"} Task</Button>
      </div>
    </form>
  );
}

export default function Tasks() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");

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
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Tasks</h1>
          <p className="text-xs text-muted-foreground">Farm activity management</p>
        </div>
      </div>

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
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
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
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(tasks as any[]).map((task: any) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed" && task.status !== "cancelled";
            return (
              <Card key={task.id} className={cn("border-0 shadow-sm hover:shadow-md transition-shadow", task.status === "completed" && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => can("write") && toggleComplete(task)} className="mt-0.5 shrink-0">
                      {STATUS_ICONS[task.status ?? "pending"]}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("font-medium text-sm text-foreground", task.status === "completed" && "line-through text-muted-foreground")}>
                          {task.title}
                        </p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", PRIORITY_STYLES[task.priority ?? "medium"])}>
                          {task.priority}
                        </span>
                        {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.category}
                        {task.dueDate ? ` · Due: ${String(task.dueDate).slice(0, 10)}` : ""}
                      </p>
                      {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>}
                    </div>
                    {can("write") && (
                      <Button variant="ghost" size="sm" onClick={() => setEditTask(task)}>Edit</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
