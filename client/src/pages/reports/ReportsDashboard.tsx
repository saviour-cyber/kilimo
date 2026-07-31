import { Link } from "wouter";
import { FileText, PlusCircle, Calendar, Archive, Activity, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reports Hub</h1>
            <p className="text-sm text-slate-500">Centralized workspace for platform-wide analytics and exports</p>
          </div>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl">
          <Link href="/reports/wizard">
            <PlusCircle className="w-4 h-4" /> Generate Report
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Generated Reports</p>
            <p className="text-2xl font-bold text-slate-800">{recentReports.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Scheduled Reports</p>
            <p className="text-2xl font-bold text-slate-800">{scheduledReports.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">AI Executive Summaries</p>
            <p className="text-2xl font-bold text-slate-800">1</p>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Generated Reports */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Archive className="w-4 h-4 text-indigo-500" />
              Recent Reports
            </h3>
            <Link href="/reports/archive" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </Link>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loadingReports ? (
              <div className="p-8 text-center text-slate-400">Loading reports...</div>
            ) : recentReports.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <FileText className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-500">No reports generated yet.</p>
                <Link href="/reports/wizard" className="text-sm text-indigo-600 mt-2 hover:underline">
                  Generate your first report
                </Link>
              </div>
            ) : (
              recentReports.map(report => (
                <div key={report.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div>
                    <h4 className="font-medium text-slate-800">{report.name}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>{format(new Date(report.generatedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      <span>•</span>
                      <span className="uppercase">{report.format}</span>
                    </div>
                  </div>
                  {report.fileUrl && (
                    <Button variant="ghost" size="sm" asChild className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                      <a href={report.fileUrl} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4 mr-2" /> Download
                      </a>
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Scheduled
            </h3>
            <Link href="/reports/scheduled" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Manage
            </Link>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loadingScheduled ? (
              <div className="p-8 text-center text-slate-400">Loading...</div>
            ) : scheduledReports.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <Calendar className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-500">No scheduled reports.</p>
              </div>
            ) : (
              scheduledReports.map(schedule => (
                <div key={schedule.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <h4 className="font-medium text-slate-800 text-sm truncate">{schedule.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500 capitalize">{schedule.frequency}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${schedule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
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
