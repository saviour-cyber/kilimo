import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { CheckSquare } from "lucide-react";

export default function WorkersAttendance() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id;

  const { data: attendance = [], isLoading } = trpc.workers.listAttendance.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Attendance Log</h2>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading attendance...</div>
      ) : attendance.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No attendance recorded</h3>
          <p className="text-sm text-muted-foreground mt-1">Start tracking worker attendance.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Table placeholder */}
          <div className="p-4 text-sm text-muted-foreground">Attendance records will appear here.</div>
        </div>
      )}
    </div>
  );
}
