import { useState } from "react";
import { useFarm } from "@/_core/hooks/useFarm";
import { trpc } from "@/_core/trpc";
import { Plus, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function WorkersList() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id;
  const [searchTerm, setSearchTerm] = useState("");

  const { data: workers = [], isLoading } = trpc.workers.listWorkers.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const filteredWorkers = workers.filter(w => 
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
        <Button className="w-full sm:w-auto bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add Worker
        </Button>
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
          {filteredWorkers.map(worker => (
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
