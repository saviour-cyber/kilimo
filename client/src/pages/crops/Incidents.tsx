import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bug, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CropsLayout from "./CropsLayout";
import { DiseaseDetector } from "@/components/intelligence/DiseaseDetector";

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-red-100 text-red-700",
  treated: "bg-amber-100 text-amber-700",
  monitoring: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

function IncidentForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: "",
    incidentType: "disease" as const,
    severity: "medium" as const,
    detectedDate: new Date().toISOString().slice(0, 10),
    treatment: "",
    notes: "",
  });

  const create = trpc.crops.createIncident.useMutation({
    onSuccess: () => { utils.crops.listIncidents.invalidate(); toast.success("Incident reported"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ ...form, farmId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Incident Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maize Streak Virus" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.incidentType} onValueChange={(v) => setForm({ ...form, incidentType: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["disease", "pest", "weather", "other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Severity</Label>
          <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["low", "medium", "high", "critical"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Detected Date *</Label>
          <Input type="date" value={form.detectedDate} onChange={(e) => setForm({ ...form, detectedDate: e.target.value })} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Treatment Applied</Label>
        <Textarea value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} rows={2} placeholder="Describe treatment..." />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending}>Report Incident</Button>
      </div>
    </form>
  );
}

function UpdateStatusForm({ farmId, incident, onClose }: { farmId: number; incident: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState(incident.status);
  const [resolvedDate, setResolvedDate] = useState("");

  const update = trpc.crops.updateIncident.useMutation({
    onSuccess: () => { utils.crops.listIncidents.invalidate(); toast.success("Status updated"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>New Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["active", "treated", "monitoring", "resolved"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {status === "resolved" && (
        <div className="space-y-1.5">
          <Label>Resolved Date</Label>
          <Input type="date" value={resolvedDate} onChange={(e) => setResolvedDate(e.target.value)} />
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => update.mutate({ incidentId: incident.id, farmId, status, resolvedDate: resolvedDate || undefined })} disabled={update.isPending}>
          Update
        </Button>
      </div>
    </div>
  );
}

export default function Incidents() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateIncident, setUpdateIncident] = useState<any>(null);

  const { data: incidents = [], isLoading } = trpc.crops.listIncidents.useQuery({ farmId }, { enabled: !!farmId });

  const active = incidents.filter((i) => i.status === "active").length;

  return (
    <CropsLayout>
      <div className="mb-6">
        <DiseaseDetector type="crop" />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {active > 0 && <span className="text-destructive font-medium">{active} active · </span>}
          {incidents.length} total incidents
        </div>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Report Incident
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bug className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No incidents reported</p>
          <p className="text-sm">Report disease, pest, or weather incidents</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <Card key={inc.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <AlertTriangle className={cn("w-4 h-4", inc.severity === "critical" ? "text-red-500" : inc.severity === "high" ? "text-orange-500" : "text-amber-500")} />
                      <span className="font-semibold text-foreground">{inc.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{inc.incidentType}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", SEVERITY_COLORS[inc.severity])}>{inc.severity}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[inc.status])}>{inc.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Detected: {String(inc.detectedDate).slice(0, 10)}</p>
                    {inc.treatment && <p className="text-xs text-muted-foreground mt-0.5">Treatment: {inc.treatment}</p>}
                  </div>
                  {can("write") && (
                    <Button variant="ghost" size="sm" onClick={() => setUpdateIncident(inc)}>Update</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report Incident</DialogTitle></DialogHeader>
          <IncidentForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!updateIncident} onOpenChange={(o) => !o && setUpdateIncident(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Incident Status</DialogTitle></DialogHeader>
          {updateIncident && <UpdateStatusForm farmId={farmId} incident={updateIncident} onClose={() => setUpdateIncident(null)} />}
        </DialogContent>
      </Dialog>
    </CropsLayout>
  );
}
