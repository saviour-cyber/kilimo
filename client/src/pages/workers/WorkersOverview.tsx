import { useFarm } from "@/_core/hooks/useFarm";
import { trpc } from "@/_core/trpc";
import { Users, UserCheck, UserMinus, AlertCircle } from "lucide-react";

export default function WorkersOverview() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id;

  const { data: workers = [] } = trpc.workers.listWorkers.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );

  const activeCount = workers.filter(w => w.status === "active").length;
  const onLeaveCount = workers.filter(w => w.status === "on_leave").length;
  const inactiveCount = workers.filter(w => w.status === "inactive" || w.status === "terminated").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Total Workers</span>
          </div>
          <p className="text-2xl font-bold">{workers.length}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <UserCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">On Leave</span>
          </div>
          <p className="text-2xl font-bold">{onLeaveCount}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserMinus className="w-4 h-4" />
            <span className="text-sm font-medium">Inactive</span>
          </div>
          <p className="text-2xl font-bold">{inactiveCount}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Activity feed will appear here.</p>
        </div>
      </div>
    </div>
  );
}
