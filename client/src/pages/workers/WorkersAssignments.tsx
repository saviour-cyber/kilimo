import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

function AssignTaskForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [workerId, setWorkerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("general");

  const { data: workers = [] } = trpc.workers.listWorkers.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Task assigned successfully");
      utils.tasks.list.invalidate({ farmId });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) {
      toast.error("Please select a worker to assign this task to");
      return;
    }
    createMutation.mutate({
      farmId,
      title,
      description,
      priority: priority as any,
      category: category as any,
      dueDate: dueDate || undefined,
      assignedToWorkerId: parseInt(workerId),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Task Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Irrigate north field"
        />
      </div>
      <div className="space-y-2">
        <Label>Assign To</Label>
        <Select value={workerId} onValueChange={setWorkerId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a worker" />
          </SelectTrigger>
          <SelectContent>
            {workers.map((w: any) => (
              <SelectItem key={w.id} value={w.id.toString()}>
                {w.firstName} {w.lastName}
                {w.position ? ` — ${w.position}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="crop">Crop</SelectItem>
              <SelectItem value="livestock">Livestock</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Due Date (Optional)</Label>
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Description (Optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Instructions or notes for the worker..."
          rows={3}
        />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || !workerId || !title.trim()}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Assign Task
        </Button>
      </div>
    </form>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function WorkersAssignments() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: allTasks = [], isLoading } = trpc.tasks.list.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const { data: workers = [] } = trpc.workers.listWorkers.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  // Only show tasks assigned to a worker (have assignedToWorkerId)
  const workerTasks = allTasks.filter((t: any) => t.assignedToWorkerId != null);
  const workerMap = workers.reduce((acc: any, w: any) => {
    acc[w.id] = w;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Work Assignments</h2>

        {can("write") && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Task to Worker</DialogTitle>
              </DialogHeader>
              {farmId && (
                <AssignTaskForm farmId={farmId} onClose={() => setDialogOpen(false)} />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading assignments...</div>
      ) : workerTasks.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No assignments yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Click "Assign Task" to give workers specific tasks.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {workerTasks.map((task: any) => {
                  const worker = workerMap[task.assignedToWorkerId];
                  return (
                    <tr
                      key={task.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[220px]">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {worker
                          ? `${worker.firstName} ${worker.lastName}`
                          : `Worker #${task.assignedToWorkerId}`}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            PRIORITY_STYLES[task.priority] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {task.dueDate
                          ? format(new Date(task.dueDate), "MMM d, yyyy")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
