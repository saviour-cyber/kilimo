import { useState, useMemo } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Loader2, UserPlus, UserMinus, Check } from "lucide-react";
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
import { toast } from "sonner";

// ─── Create Team Form ────────────────────────────────────────────────────────
function TeamForm({ farmId, onClose }: { farmId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = trpc.workers.createTeam.useMutation({
    onSuccess: () => {
      toast.success("Team created successfully");
      utils.workers.listTeams.invalidate({ farmId });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ farmId, name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Team Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Harvesting Crew"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the team's duties"
          rows={3}
        />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
          {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Team
        </Button>
      </div>
    </form>
  );
}

// ─── Manage Team Members Dialog ───────────────────────────────────────────────
function ManageMembersDialog({
  farmId,
  team,
  allWorkers,
}: {
  farmId: number;
  team: any;
  allWorkers: any[];
}) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);

  // Workers currently on this team
  const initialSelected = useMemo(
    () => new Set(allWorkers.filter((w) => w.teamId === team.id).map((w) => w.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, allWorkers, team.id]
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Re-init whenever dialog opens
  const handleOpenChange = (val: boolean) => {
    if (val) setSelected(new Set(initialSelected));
    setOpen(val);
  };

  const updateMutation = trpc.workers.updateWorker.useMutation();

  const toggle = (workerId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(workerId) ? next.delete(workerId) : next.add(workerId);
      return next;
    });
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    // Determine workers to add (newly selected) and remove (deselected)
    const toAdd = Array.from(selected).filter((id) => !initialSelected.has(id));
    const toRemove = Array.from(initialSelected).filter((id) => !selected.has(id));

    try {
      const workerMap = Object.fromEntries(allWorkers.map((w) => [w.id, w]));

      // Add workers to this team
      for (const id of toAdd) {
        const w = workerMap[id];
        if (!w) continue;
        await updateMutation.mutateAsync({
          farmId,
          workerId: id,
          firstName: w.firstName,
          lastName: w.lastName,
          teamId: team.id,
        });
      }

      // Remove workers from this team (set teamId to undefined)
      for (const id of toRemove) {
        const w = workerMap[id];
        if (!w) continue;
        await updateMutation.mutateAsync({
          farmId,
          workerId: id,
          firstName: w.firstName,
          lastName: w.lastName,
          teamId: undefined,
        });
      }

      await utils.workers.listWorkers.invalidate({ farmId });
      toast.success(`Team "${team.name}" membership updated`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update team members");
    } finally {
      setSaving(false);
    }
  };

  const teamMembers = allWorkers.filter((w) => w.teamId === team.id);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="mt-3 w-full">
          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
          Manage Members ({teamMembers.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Members — {team.name}</DialogTitle>
        </DialogHeader>

        <div className="pt-2 space-y-1">
          {allWorkers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No workers on this farm yet.
            </p>
          ) : (
            allWorkers.map((worker: any) => {
              const isSelected = selected.has(worker.id);
              const currentTeamName =
                !worker.teamId || worker.teamId === team.id
                  ? null
                  : `currently in another team`;

              return (
                <button
                  key={worker.id}
                  type="button"
                  onClick={() => toggle(worker.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isSelected
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                    {worker.firstName[0]}
                    {worker.lastName[0]}
                  </div>

                  {/* Name & position */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {worker.firstName} {worker.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {worker.position || "No role assigned"}
                      {currentTeamName && (
                        <span className="text-amber-500 ml-1">· {currentTeamName}</span>
                      )}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      worker.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {worker.status}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="pt-4 flex justify-between items-center gap-2 border-t mt-2">
          <p className="text-xs text-muted-foreground">
            {selected.size} worker{selected.size !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkersTeams() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: teams = [], isLoading } = trpc.workers.listTeams.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const { data: allWorkers = [] } = trpc.workers.listWorkers.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Teams</h2>

        {can("write") && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
              </DialogHeader>
              {farmId && (
                <TeamForm farmId={farmId} onClose={() => setDialogOpen(false)} />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No teams created</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your workers into teams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team: any) => {
            const members = allWorkers.filter((w: any) => w.teamId === team.id);
            return (
              <div
                key={team.id}
                className="bg-card border border-border rounded-xl p-4 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{team.name}</h4>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-2xl font-bold text-primary">{members.length}</span>
                    <p className="text-xs text-muted-foreground">
                      {members.length === 1 ? "member" : "members"}
                    </p>
                  </div>
                </div>

                {/* Member avatar strip */}
                {members.length > 0 && (
                  <div className="flex mt-3 -space-x-2">
                    {members.slice(0, 5).map((m: any) => (
                      <div
                        key={m.id}
                        title={`${m.firstName} ${m.lastName}`}
                        className="w-8 h-8 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-xs font-semibold text-primary"
                      >
                        {m.firstName[0]}
                        {m.lastName[0]}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {can("write") && farmId && (
                  <ManageMembersDialog
                    farmId={farmId}
                    team={team}
                    allWorkers={allWorkers}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}