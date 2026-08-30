import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  FileText,
  CheckSquare,
  Banknote,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Payroll Form ─────────────────────────────────────────────────────────────
function PayrollForm({
  farmId,
  workerId,
  onClose,
}: {
  farmId: number;
  workerId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [amount, setAmount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  const mutation = trpc.workers.createPayroll.useMutation({
    onSuccess: () => {
      toast.success("Payroll record created");
      utils.workers.listPayroll.invalidate({ farmId, workerId });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      farmId,
      workerId,
      amount: parseFloat(amount),
      periodStart,
      periodEnd,
      status: status as any,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Amount (KES)</Label>
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="e.g. 15000"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Period Start</Label>
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Period End</Label>
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Add Payroll
        </Button>
      </div>
    </form>
  );
}

// ─── Document Upload Form ──────────────────────────────────────────────────────
function DocumentForm({
  farmId,
  workerId,
  onClose,
}: {
  farmId: number;
  workerId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("other");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const mutation = trpc.workers.createDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded");
      utils.workers.listDocuments.invalidate({ farmId, workerId });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      mutation.mutate({
        farmId,
        workerId,
        title,
        documentType: docType as any,
        base64,
        contentType: file.type,
        fileName: file.name,
      });
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Document Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Employment Contract 2024" />
      </div>
      <div className="space-y-2">
        <Label>Document Type</Label>
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="id">ID Document</SelectItem>
            <SelectItem value="certificate">Certificate</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>File</Label>
        <Input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
        <p className="text-xs text-muted-foreground">PDF, images, or Word documents</p>
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || mutation.isPending}>
          {(loading || mutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Upload
        </Button>
      </div>
    </form>
  );
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  on_leave: "bg-amber-100 text-amber-700",
  inactive: "bg-slate-100 text-slate-700",
  terminated: "bg-red-100 text-red-700",
};

const PAYROLL_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const ATTENDANCE_BADGE: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-700",
  half_day: "bg-amber-100 text-amber-700",
  on_leave: "bg-blue-100 text-blue-700",
};

export default function WorkerProfile() {
  const { workerId: workerIdStr } = useParams<{ workerId: string }>();
  const workerId = parseInt(workerIdStr ?? "0");
  const [, setLocation] = useLocation();
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id;
  const utils = trpc.useUtils();

  const [payrollOpen, setPayrollOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);

  const { data: worker, isLoading } = trpc.workers.getWorker.useQuery(
    { farmId: farmId!, workerId },
    { enabled: !!farmId && !!workerId }
  );
  const { data: payrolls = [] } = trpc.workers.listPayroll.useQuery(
    { farmId: farmId!, workerId },
    { enabled: !!farmId && !!workerId }
  );
  const { data: documents = [] } = trpc.workers.listDocuments.useQuery(
    { farmId: farmId!, workerId },
    { enabled: !!farmId && !!workerId }
  );
  const { data: attendance = [] } = trpc.workers.listAttendance.useQuery(
    { farmId: farmId!, workerId },
    { enabled: !!farmId && !!workerId }
  );
  const { data: assignedTasks = [] } = trpc.tasks.list.useQuery(
    { farmId: farmId!, workerId },
    { enabled: !!farmId && !!workerId }
  );

  const markPaidMutation = trpc.workers.updatePayroll.useMutation({
    onSuccess: () => {
      toast.success("Marked as paid");
      utils.workers.listPayroll.invalidate({ farmId, workerId });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteDocMutation = trpc.workers.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document removed");
      utils.workers.listDocuments.invalidate({ farmId, workerId });
    },
    onError: (err) => toast.error(err.message),
  });

  if (!farmId) return null;
  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (!worker) return <div className="p-6 text-sm text-muted-foreground">Worker not found.</div>;

  const presentCount = attendance.filter((a: any) => a.status === "present").length;
  const absentCount = attendance.filter((a: any) => a.status === "absent").length;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => setLocation("/workers")} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> All Workers
      </Button>

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {worker.firstName[0]}
          {worker.lastName[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">
              {worker.firstName} {worker.lastName}
            </h1>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                STATUS_BADGE[worker.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {worker.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5">{worker.position || "No position set"}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            {worker.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {worker.phone}
              </span>
            )}
            {worker.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {worker.email}
              </span>
            )}
            <span className="flex items-center gap-1.5 capitalize">
              <Briefcase className="w-3.5 h-3.5" /> {worker.employmentType.replace("_", " ")}
            </span>
            {worker.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Since{" "}
                {format(new Date(worker.startDate), "MMM yyyy")}
              </span>
            )}
          </div>
          {worker.skills && (
            <p className="mt-2 text-sm text-muted-foreground flex gap-1 items-center">
              <Star className="w-3.5 h-3.5 shrink-0" /> {worker.skills}
            </p>
          )}
        </div>
        {/* Quick stats */}
        <div className="flex sm:flex-col gap-4 sm:gap-2 shrink-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
            <div className="text-xs text-muted-foreground">Days Present</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{absentCount}</div>
            <div className="text-xs text-muted-foreground">Days Absent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{assignedTasks.filter((t: any) => t.status !== "completed").length}</div>
            <div className="text-xs text-muted-foreground">Open Tasks</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* ── Attendance ── */}
        <TabsContent value="attendance" className="mt-4">
          {attendance.length === 0 ? (
            <div className="text-sm text-muted-foreground">No attendance records for this worker yet.</div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a: any) => (
                      <tr key={a.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {format(new Date(a.date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${ATTENDANCE_BADGE[a.status] ?? ""}`}>
                            {a.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{a.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Tasks ── */}
        <TabsContent value="tasks" className="mt-4">
          {assignedTasks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tasks assigned to this worker.</div>
          ) : (
            <div className="space-y-2">
              {assignedTasks.map((task: any) => (
                <div key={task.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                  <CheckSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    task.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {task.status?.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Payroll ── */}
        <TabsContent value="payroll" className="mt-4 space-y-4">
          {can("write") && (
            <div className="flex justify-end">
              <Dialog open={payrollOpen} onOpenChange={setPayrollOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Payroll Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Payroll Record</DialogTitle></DialogHeader>
                  <PayrollForm farmId={farmId} workerId={workerId} onClose={() => setPayrollOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          )}

          {payrolls.length === 0 ? (
            <div className="text-sm text-muted-foreground">No payroll records yet.</div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment Date</th>
                      {can("write") && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.map((p: any) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {format(new Date(p.periodStart), "MMM d")} –{" "}
                          {format(new Date(p.periodEnd), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {p.currency} {parseFloat(p.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${PAYROLL_BADGE[p.status] ?? ""}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.paymentDate ? format(new Date(p.paymentDate), "MMM d, yyyy") : "—"}
                        </td>
                        {can("write") && (
                          <td className="px-4 py-3">
                            {p.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() =>
                                  markPaidMutation.mutate({
                                    farmId,
                                    payrollId: p.id,
                                    status: "paid",
                                    paymentDate: new Date().toISOString().split("T")[0],
                                  })
                                }
                              >
                                Mark Paid
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Documents ── */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          {can("write") && (
            <div className="flex justify-end">
              <Dialog open={docOpen} onOpenChange={setDocOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="w-4 h-4 mr-1" /> Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                  <DocumentForm farmId={farmId} workerId={workerId} onClose={() => setDocOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          )}

          {documents.length === 0 ? (
            <div className="text-sm text-muted-foreground">No documents uploaded for this worker.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc: any) => (
                <div key={doc.id} className="bg-card border border-border rounded-xl p-4 flex gap-3 items-start">
                  <FileText className="w-8 h-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {doc.documentType.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    {can("write") && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() =>
                          deleteDocMutation.mutate({ farmId, documentId: doc.id })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
