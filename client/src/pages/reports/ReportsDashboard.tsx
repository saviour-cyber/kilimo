import { Link } from "wouter";
import { FileText, PlusCircle, Calendar, Archive, Activity, Download, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsDashboard() {
  const { currentFarm } = useFarm();
  
  const { data: recentReports = [], isLoading: loadingReports } = trpc.reports.getGeneratedReports.useQuery(
    { farmId: currentFarm?.farm.id ?? 0, limit: 5 },
    { enabled: !!currentFarm?.farm.id }
  );

  const { data: scheduledReports = [], isLoading: loadingScheduled } = trpc.reports.getScheduledReports.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id }
  );

  if (!currentFarm) return null;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 space-y-6">
      <PageHeader 
        title="Reports" 
        description="Centralized workspace for analytics and data exports."
      >
        <Button asChild className="gap-2 rounded-xl">
          <Link href="/reports/wizard">
            <PlusCircle className="w-4 h-4" /> Generate Report
          </Link>
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 hover:border-black/10 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Generated</p>
            <p className="text-2xl font-bold text-foreground font-serif tracking-tight">{recentReports.length}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 hover:border-black/10 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Scheduled</p>
            <p className="text-2xl font-bold text-foreground font-serif tracking-tight">{scheduledReports.length}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 hover:border-black/10 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Summaries</p>
            <p className="text-2xl font-bold text-foreground font-serif tracking-tight">1</p>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Generated Reports */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-black/[0.02]">
            <h3 className="font-semibold text-foreground">Recent Reports</h3>
            <Link href="/reports/archive" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              View archive <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-border">
            {loadingReports ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                     <div className="space-y-2"><Skeleton className="h-4 w-32"/><Skeleton className="h-3 w-24"/></div>
                     <Skeleton className="h-8 w-24 rounded-lg"/>
                  </div>
                ))}
              </div>
            ) : recentReports.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No reports generated yet</p>
                <Link href="/reports/wizard" className="text-sm text-primary mt-1 hover:underline">
                  Generate your first report
                </Link>
              </div>
            ) : (
              recentReports.map(report => (
                <div key={report.id} className="p-5 flex items-center justify-between hover:bg-black/[0.01] transition-colors">
                  <div>
                    <h4 className="font-medium text-[15px] text-foreground">{report.name}</h4>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-medium">
                      <span>{format(new Date(report.generatedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      <span>•</span>
                      <span className="uppercase tracking-wider">{report.format}</span>
                    </div>
                  </div>
                  {report.fileUrl && (
                    <Button variant="outline" size="sm" asChild className="rounded-xl border-black/10 hover:bg-black/5">
                      <a href={report.fileUrl} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4 mr-2 text-muted-foreground" /> Download
                      </a>
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-black/[0.02]">
            <h3 className="font-semibold text-foreground">Scheduled</h3>
            <Link href="/reports/scheduled" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              Manage <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-border">
            {loadingScheduled ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                     <div className="space-y-2"><Skeleton className="h-4 w-32"/><Skeleton className="h-3 w-20"/></div>
                  </div>
                ))}
              </div>
            ) : scheduledReports.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No scheduled reports</p>
              </div>
            ) : (
              scheduledReports.map(schedule => (
                <div key={schedule.id} className="p-5 hover:bg-black/[0.01] transition-colors">
                  <h4 className="font-medium text-[15px] text-foreground truncate">{schedule.name}</h4>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-xs font-medium text-muted-foreground capitalize">{schedule.frequency}</span>
                    <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full ${
                      schedule.isActive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-black/5 text-muted-foreground'
                    }`}>
                      {schedule.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
