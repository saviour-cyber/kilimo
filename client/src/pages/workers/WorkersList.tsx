import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Plus, Search, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

function WorkerForm({ farmId, onClose }: { farmId: number, onClose: () => void }) {
  const utils = trpc.useUtils();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");

  const createMutation = trpc.workers.createWorker.useMutation({
    onSuccess: () => {
      toast.success("Worker added successfully");
      utils.workers.listWorkers.invalidate({ farmId });
      onClose();
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      farmId,
      firstName,
      lastName,
      position,
      phone,
      email,
      employmentType: employmentType as any,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={lastName} onChange={e => setLastName(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Position / Role</Label>
        <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Tractor Driver" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} type="email" onChange={e => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Employment Type</Label>
        <Select value={employmentType} onValueChange={setEmploymentType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full_time">Full Time</SelectItem>
            <SelectItem value="part_time">Part Time</SelectItem>
            <SelectItem value="seasonal">Seasonal</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
            <SelectItem value="temporary">Temporary</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save Worker
        </Button>
      </div>
    </form>
  );
}

export default function WorkersList() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id;
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: workers = [], isLoading } = trpc.workers.listWorkers.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const filteredWorkers = workers.filter((w: any) => 
    (w.firstName + " " + w.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {can("write") && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Worker</DialogTitle></DialogHeader>
              {farmId && <WorkerForm farmId={farmId} onClose={() => setDialogOpen(false)} />}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading workers...</div>
      ) : filteredWorkers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No workers found</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            {searchTerm ? "No workers match your search." : "You haven't added any workers to this farm yet. Click 'Add Worker' to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((worker: any) => (
            <div key={worker.id} className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <span className="font-semibold text-slate-600">
                  {worker.firstName[0]}{worker.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{worker.firstName} {worker.lastName}</h4>
                <p className="text-sm text-muted-foreground truncate">{worker.position || "No position set"}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    worker.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                    worker.status === 'on_leave' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {worker.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {worker.employmentType.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}