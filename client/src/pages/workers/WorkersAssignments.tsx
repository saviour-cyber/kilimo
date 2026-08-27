import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { ClipboardList } from "lucide-react";

export default function WorkersAssignments() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id;

  // We reuse tasksRouter here to fetch tasks assigned to workers
  // For now, this is just a placeholder view.
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Work Assignments</h2>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">No assignments</h3>
        <p className="text-sm text-muted-foreground mt-1">Assign tasks to your workers.</p>
      </div>
    </div>
  );
}
