import { Link } from "wouter";
import { Calendar, ArrowLeft, Clock, Settings, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ScheduledReports() {
  const { currentFarm } = useFarm();
  
  const { data: schedules = [], isLoading } = trpc.reports.getScheduledReports.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id }
  );

  if (!currentFarm) return null;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 space-y-6">
      <PageHeader 
        title="Scheduled Reports" 
        description="Manage recurring automated reports"
      >
        <Button variant="outline" asChild className="gap-2 rounded-full border-2 border-[#1E3F2D] bg-transparent text-[#1E3F2D] hover:bg-[#1E3F2D]/5 font-bold shadow-none hover:text-[#1E3F2D]">
          <Link href="/reports">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </Button>
      </PageHeader>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">No scheduled reports.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Currently automated scheduling is managed during generation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {schedules.map(schedule => (
              <div key={schedule.id} className="p-5 flex items-center justify-between hover:bg-black/[0.01] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-1">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-[15px] text-foreground">{schedule.name}</h4>
                      <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full ${
                        schedule.isActive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-black/5 text-muted-foreground'
                      }`}>
                        {schedule.isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-muted-foreground">
                      <span className="capitalize">{schedule.frequency}</span>
                      <span>•</span>
                      <span>Next Run: {format(new Date(schedule.nextRunAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info("Report execution queued manually")} className="rounded-full border-2 border-[#1E3F2D] bg-transparent text-[#1E3F2D] hover:bg-[#1E3F2D]/5 font-bold shadow-none hover:text-[#1E3F2D]">
                    <Play className="w-4 h-4 mr-2" /> Run Now
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full border-2 border-[#1E3F2D] bg-transparent text-[#1E3F2D] hover:bg-[#1E3F2D]/5 font-bold shadow-none hover:text-[#1E3F2D]">
                    <Settings className="w-4 h-4" />
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
