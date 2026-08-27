import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function TeamForm({ farmId, onClose }: { farmId: number, onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = trpc.workers.createTeam.useMutation({
    onSuccess: () => {
      toast.success("Team created successfully");
      utils.workers.listTeams.invalidate({ farmId });
      onClose();
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      farmId,
      name,
      description,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Team Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Harvesting Crew" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Brief description of the team's duties"
          rows={3}
        />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Create Team
        </Button>
      </div>
    </form>
  );
}

export default function WorkersTeams() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: teams = [], isLoading } = trpc.workers.listTeams.useQuery(
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
              <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
              {farmId && <TeamForm farmId={farmId} onClose={() => setDialogOpen(false)} />}
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
          <p className="text-sm text-muted-foreground mt-1">Organize your workers into teams.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team: any) => (
            <div key={team.id} className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-semibold">{team.name}</h4>
              <p className="text-sm text-muted-foreground">{team.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}