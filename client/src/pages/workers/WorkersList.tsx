import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Plus, Search, User, Pencil, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";

function WorkerForm({
  farmId,
  worker,
  teams,
  onClose,
}: {
  farmId: number;
  worker?: any;
  teams: any[];
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [firstName, setFirstName] = useState(worker?.firstName ?? "");
  const [lastName, setLastName] = useState(worker?.lastName ?? "");
  const [position, setPosition] = useState(worker?.position ?? "");
  const [phone, setPhone] = useState(worker?.phone ?? "");
  const [email, setEmail] = useState(worker?.email ?? "");
  const [employmentType, setEmploymentType] = useState(
    worker?.employmentType ?? "full_time"
  );
  const [status, setStatus] = useState(worker?.status ?? "active");
  const [teamId, setTeamId] = useState(worker?.teamId?.toString() ?? "none");
  const [startDate, setStartDate] = useState(
    worker?.startDate ? new Date(worker.startDate).toISOString().split("T")[0] : ""
  );
  const [skills, setSkills] = useState(worker?.skills ?? "");
  const [notes, setNotes] = useState(worker?.notes ?? "");

  const createMutation = trpc.workers.createWorker.useMutation({
    onSuccess: () => {
      toast.success("Worker added successfully");
      utils.workers.listWorkers.invalidate({ farmId });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.workers.updateWorker.useMutation({
    onSuccess: () => {
      toast.success("Worker updated");
      utils.workers.listWorkers.invalidate({ farmId });
      utils.workers.getWorker.invalidate({ farmId, workerId: worker?.id });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      farmId,
      firstName,
      lastName,
      position,
      phone,
      email,
      employmentType: employmentType as any,
      teamId: teamId && teamId !== "none" ? parseInt(teamId) : undefined,
      startDate: startDate || undefined,
      skills,
      notes,
    };
    if (worker) {
      updateMutation.mutate({ ...payload, workerId: worker.id, status: status as any });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Position / Role</Label>
        <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Tractor Driver" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employment Type</Label>
          <Select value={employmentType} onValueChange={setEmploymentType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {worker && (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Team</Label>
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No team</SelectItem>
              {teams.map((t: any) => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Skills</Label>
        <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Irrigation, Pruning" />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {worker ? "Update Worker" : "Save Worker"}
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

export default function WorkersList() {
  const { currentFarm, can } = useFarm();
  const [, setLocation] = useLocation();
  const farmId = currentFarm?.farm.id;
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editWorker, setEditWorker] = useState<any>(null);
  const [deleteWorker, setDeleteWorker] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const utils = trpc.useUtils();

  const { data: workers = [], isLoading } = trpc.workers.listWorkers.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );
  const { data: teams = [] } = trpc.workers.listTeams.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const deleteMutation = trpc.workers.deleteWorker.useMutation({
    onSuccess: () => {
      toast.success("Worker removed");
      utils.workers.listWorkers.invalidate({ farmId });
      setDeleteWorker(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = workers.filter((w: any) => {
    const matchesSearch =
      (w.firstName + " " + w.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    const matchesTeam =
      teamFilter === "all" ||
      (teamFilter === "none" ? !w.teamId : w.teamId?.toString() === teamFilter);
    return matchesSearch && matchesStatus && matchesTeam;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="none">No Team</SelectItem>
              {teams.map((t: any) => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {can("write") && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Worker</DialogTitle></DialogHeader>
              {farmId && (
                <WorkerForm farmId={farmId} teams={teams} onClose={() => setAddOpen(false)} />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading workers...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No workers found</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            {searchTerm
              ? "No workers match your search."
              : "You haven't added any workers to this farm yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((worker: any) => (
            <div
              key={worker.id}
              className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setLocation(`/workers/${worker.id}`)}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <span className="font-semibold text-slate-600">
                  {worker.firstName[0]}
                  {worker.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">
                  {worker.firstName} {worker.lastName}
                </h4>
                <p className="text-sm text-muted-foreground truncate">
                  {worker.position || "No position set"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      STATUS_BADGE[worker.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {worker.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {worker.employmentType.replace("_", " ")}
                  </span>
                </div>
              </div>

              {can("write") && (
                <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditWorker(worker)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setDeleteWorker(worker)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editWorker} onOpenChange={(o) => !o && setEditWorker(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Worker</DialogTitle></DialogHeader>
          {farmId && editWorker && (
            <WorkerForm
              farmId={farmId}
              worker={editWorker}
              teams={teams}
              onClose={() => setEditWorker(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteWorker} onOpenChange={(o) => !o && setDeleteWorker(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Worker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>
                {deleteWorker?.firstName} {deleteWorker?.lastName}
              </strong>{" "}
              from the farm. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() =>
                farmId &&
                deleteWorker &&
                deleteMutation.mutate({ farmId, workerId: deleteWorker.id })
              }
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}