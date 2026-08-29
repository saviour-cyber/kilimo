import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { CheckSquare, Plus, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ─── Single Attendance Form ──────────────────────────────────────────────────
function AttendanceForm({
  farmId,
  onClose,
}: {
  farmId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [workerId, setWorkerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("present");
  const [notes, setNotes] = useState("");

  const { data: workers = [] } = trpc.workers.listWorkers.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const mutation = trpc.workers.recordAttendance.useMutation({
    onSuccess: () => {
      toast.success("Attendance recorded");
      utils.workers.listAttendance.invalidate({ farmId });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) return toast.error("Please select a worker");
    mutation.mutate({
      farmId,
      workerId: parseInt(workerId),
      date,
      status: status as any,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Worker</Label>
        <Select value={workerId} onValueChange={setWorkerId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a worker" />
          </SelectTrigger>
          <SelectContent>
            {workers.map((w: any) => (
              <SelectItem key={w.id} value={w.id.toString()}>
                {w.firstName} {w.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="half_day">Half Day</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Notes (Optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Arrived late, sick leave..."
          rows={2}
        />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending || !workerId}>
          {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Record
        </Button>
      </div>
    </form>
  );
}

// ─── Bulk Attendance Form ────────────────────────────────────────────────────
type BulkRow = { workerId: number; status: string; notes: string };

function BulkAttendanceForm({
  farmId,
  onClose,
}: {
  farmId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: workers = [] } = trpc.workers.listWorkers.useQuery(
    { farmId },
    { enabled: !!farmId }
  );
  const [rows, setRows] = useState<BulkRow[]>([]);

  // Pre-populate all active workers when workers load
  const initRows = () => {
    if (rows.length === 0 && workers.length > 0) {
      setRows(workers.map((w: any) => ({ workerId: w.id, status: "present", notes: "" })));
    }
  };
  if (rows.length === 0 && workers.length > 0) initRows();

  const updateRow = (idx: number, key: keyof BulkRow, val: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));
  };

  const mutation = trpc.workers.recordBulkAttendance.useMutation({
    onSuccess: () => {
      toast.success("Bulk attendance recorded");
      utils.workers.listAttendance.invalidate({ farmId });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      farmId,
      date,
      records: rows.map((r) => ({
        workerId: r.workerId,
        status: r.status as any,
        notes: r.notes,
      })),
    });
  };

  const workerMap = workers.reduce((acc: any, w: any) => {
    acc[w.id] = w;
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="max-h-80 overflow-y-auto space-y-2">
        {rows.map((row, idx) => (
          <div key={row.workerId} className="flex gap-2 items-center">
            <div className="w-36 text-sm font-medium truncate">
              {workerMap[row.workerId]?.firstName} {workerMap[row.workerId]?.lastName}
            </div>
            <Select value={row.status} onValueChange={(val) => updateRow(idx, "status", val)}>
              <SelectTrigger className="h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="h-8 flex-1"
              placeholder="Notes"
              value={row.notes}
              onChange={(e) => updateRow(idx, "notes", e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending || rows.length === 0}>
          {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save All ({rows.length} workers)
        </Button>
      </div>
    </form>
  );
}

const STATUS_BADGE: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-700",
  half_day: "bg-amber-100 text-amber-700",
  on_leave: "bg-blue-100 text-blue-700",
};

export default function WorkersAttendance() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id;
  const [singleOpen, setSingleOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: attendance = [], isLoading } = trpc.workers.listAttendance.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );
  const { data: workers = [] } = trpc.workers.listWorkers.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const workerMap = workers.reduce((acc: any, w: any) => {
    acc[w.id] = w;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Attendance Log</h2>

        {can("write") && (
          <div className="flex gap-2">
            {/* Bulk attendance */}
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Log All Workers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Attendance</DialogTitle>
                </DialogHeader>
                {farmId && (
                  <BulkAttendanceForm farmId={farmId} onClose={() => setBulkOpen(false)} />
                )}
              </DialogContent>
            </Dialog>
            {/* Single attendance */}
            <Dialog open={singleOpen} onOpenChange={setSingleOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Attendance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Attendance</DialogTitle>
                </DialogHeader>
                {farmId && (
                  <AttendanceForm farmId={farmId} onClose={() => setSingleOpen(false)} />
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading attendance...</div>
      ) : attendance.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No attendance recorded</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start tracking worker attendance.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Worker</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record: any) => {
                  const worker = workerMap[record.workerId];
                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {format(new Date(record.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {worker
                          ? `${worker.firstName} ${worker.lastName}`
                          : `Worker #${record.workerId}`}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            STATUS_BADGE[record.status] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {record.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">
                        {record.notes || "—"}
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