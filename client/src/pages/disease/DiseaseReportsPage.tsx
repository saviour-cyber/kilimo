import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Stethoscope, PlusCircle, TrendingUp, BarChart3, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DiseaseKpiWidget, DiseaseSummaryWidget } from "@/components/widgets/modules/DiseaseWidgets";

// ─── Report Row ───────────────────────────────────────────────────────────────
function SeverityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-6 text-right">{count}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DiseaseReportsPage() {
  const { currentFarm } = useFarm();
  const { data: diseaseStats } = trpc.disease.getSummary.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id }
  );

  const { data: allScans = [] } = trpc.disease.getScans.useQuery(
    { farmId: currentFarm?.farm.id ?? 0, limit: 100 },
    { enabled: !!currentFarm?.farm.id }
  );

  if (!currentFarm) return null;

  // Compute severity breakdown
  const severityBreakdown = {
    critical: allScans.filter((s) => s.severity === "critical").length,
    high:     allScans.filter((s) => s.severity === "high").length,
    medium:   allScans.filter((s) => s.severity === "medium").length,
    low:      allScans.filter((s) => s.severity === "low").length,
  };

  // Type breakdown
  const cropScans = allScans.filter((s) => s.scanType === "crop").length;
  const livestockScans = allScans.filter((s) => s.scanType === "livestock").length;
  const total = allScans.length;

  // Status breakdown
  const statusBreakdown = {
    pending:      allScans.filter((s) => s.status === "pending_review").length,
    verified:     allScans.filter((s) => s.status === "verified").length,
    treated:      allScans.filter((s) => s.status === "treated").length,
    falsePositive: allScans.filter((s) => s.status === "false_positive").length,
  };

  // Top diseases
  const diseaseCounts: Record<string, number> = {};
  allScans.forEach((s) => {
    if (s.detectedDisease) diseaseCounts[s.detectedDisease] = (diseaseCounts[s.detectedDisease] ?? 0) + 1;
  });
  const topDiseases = Object.entries(diseaseCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Disease Reports</h1>
            <p className="text-sm text-slate-500">Aggregate insights from all disease scans</p>
          </div>
        </div>
        <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white gap-2 rounded-xl">
          <Link href={`/farms/${currentFarm?.farm.id}/disease/scans/new`}>
            <PlusCircle className="w-4 h-4" /> New Scan
          </Link>
        </Button>
      </div>

      {/* KPI row */}
      <DiseaseKpiWidget farmId={currentFarm.farm.id} />

      {/* Analytics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Severity breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Severity Breakdown</h3>
          </div>
          <div className="space-y-3">
            <SeverityBar label="Critical" count={severityBreakdown.critical} total={total} color="bg-red-500" />
            <SeverityBar label="High"     count={severityBreakdown.high}     total={total} color="bg-orange-400" />
            <SeverityBar label="Medium"   count={severityBreakdown.medium}   total={total} color="bg-yellow-400" />
            <SeverityBar label="Low"      count={severityBreakdown.low}      total={total} color="bg-green-500" />
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Resolution Status</h3>
          </div>
          <div className="space-y-3">
            <SeverityBar label="Pending"   count={statusBreakdown.pending}       total={total} color="bg-amber-400" />
            <SeverityBar label="Verified"  count={statusBreakdown.verified}      total={total} color="bg-blue-400" />
            <SeverityBar label="Treated"   count={statusBreakdown.treated}       total={total} color="bg-green-500" />
            <SeverityBar label="False +"   count={statusBreakdown.falsePositive} total={total} color="bg-slate-300" />
          </div>
        </div>

        {/* Scan type split */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Scan Type Split</h3>
          </div>
          <div className="space-y-3">
            <SeverityBar label="Crop"      count={cropScans}      total={total} color="bg-green-500" />
            <SeverityBar label="Livestock" count={livestockScans} total={total} color="bg-amber-500" />
          </div>
        </div>

        {/* Top detected diseases */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Top Detected Diseases</h3>
          </div>
          {topDiseases.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No disease data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topDiseases.map(([disease, count], i) => (
                <div key={disease} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 flex-1 truncate">{disease}</span>
                  <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent scans widget */}
      <DiseaseSummaryWidget farmId={currentFarm.farm.id} />
    </div>
  );
}
