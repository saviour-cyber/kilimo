import { useFarm } from "@/_core/hooks/useFarm";
import { trpc } from "@/_core/trpc";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkersTeams() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id;

  const { data: teams = [], isLoading } = trpc.workers.listTeams.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Teams</h2>
        <Button className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
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
          {teams.map(team => (
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
