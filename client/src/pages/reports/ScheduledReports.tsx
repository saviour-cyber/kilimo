import { Link } from "wouter";
import { Calendar, ArrowLeft, Clock, Settings, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ScheduledReports() {
  const { currentFarm } = useFarm();
  
  const { data: schedules = [], isLoading } = trpc.reports.getScheduledReports.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id }
  );

  if (!currentFarm) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Scheduled Reports
          </h1>
          <p className="text-sm text-muted-foreground">Manage recurring automated reports</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <Clock className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-muted-foreground font-medium">No scheduled reports.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Currently automated scheduling is managed during generation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {schedules.map(schedule => (
              <div key={schedule.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted transition-colors">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {schedule.name}
                    {!schedule.isActive && (
                      <span className="text-[10px] uppercase font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Paused</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-emerald-600 capitalize bg-emerald-50 px-2 py-0.5 rounded-md">
                      {schedule.frequency}
                    </span>
                    <span className="uppercase">{schedule.format}</span>
                    <span>â€¢ Next run: {format(new Date(schedule.nextRunAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info("Coming soon: Manually trigger schedule")}>
                    <Play className="w-4 h-4 text-emerald-600" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Coming soon: Edit schedule")}>
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
