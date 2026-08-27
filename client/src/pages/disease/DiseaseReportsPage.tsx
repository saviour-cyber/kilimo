import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Stethoscope, PlusCircle, TrendingUp, BarChart3, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DiseaseKpiWidget, DiseaseSummaryWidget } from "@/components/widgets/modules/DiseaseWidgets";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

// ─── Severity Bar ─────────────────────────────────────────────────────────────
function SeverityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground w-6 text-right">{count}</span>
    </div>
  );
}

// ─── Analytics Card ───────────────────────────────────────────────────────────
function AnalyticsCard({ title, icon: Icon, iconColor, children }: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", iconColor)} />
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DiseaseReportsPage() {
  const { currentFarm } = useFarm();
  const { data: allScans = [] } = trpc.disease.getScans.useQuery(
    { farmId: currentFarm?.farm.id ?? 0, limit: 100 },
    { enabled: !!currentFarm?.farm.id }
  );

  if (!currentFarm) return null;

  const total = allScans.length;

  const severityBreakdown = {
    critical: allScans.filter((s) => s.severity === "critical").length,
    high:     allScans.filter((s) => s.severity === "high").length,
    medium:   allScans.filter((s) => s.severity === "medium").length,
    low:      allScans.filter((s) => s.severity === "low").length,
  };

  const cropScans      = allScans.filter((s) => s.scanType === "crop").length;
  const livestockScans = allScans.filter((s) => s.scanType === "livestock").length;

  const statusBreakdown = {
    pending:       allScans.filter((s) => s.status === "pending_review").length,
    verified:      allScans.filter((s) => s.status === "verified").length,
    treated:       allScans.filter((s) => s.status === "treated").length,
    falsePositive: allScans.filter((s) => s.status === "false_positive").length,
  };

  const diseaseCounts: Record<string, number> = {};
  allScans.forEach((s) => {
    if (s.detectedDisease) diseaseCounts[s.detectedDisease] = (diseaseCounts[s.detectedDisease] ?? 0) + 1;
  });
  const topDiseases = Object.entries(diseaseCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Disease Reports"
        description="Aggregate insights from all disease scans"
        icon={BarChart3}
        iconBg="bg-violet-100"
        iconColor="text-violet-600"
        action={
          <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Link href={`/farms/${currentFarm?.farm.id}/disease/scans/new`}>
              <PlusCircle className="w-4 h-4" /> New Scan
            </Link>
          </Button>
        }
      />

      {/* KPI row */}
      <DiseaseKpiWidget farmId={currentFarm.farm.id} />

      {/* Analytics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnalyticsCard title="Severity Breakdown" icon={AlertTriangle} iconColor="text-orange-500">
          <div className="space-y-3">
            <SeverityBar label="Critical" count={severityBreakdown.critical} total={total} color="bg-red-500" />
            <SeverityBar label="High"     count={severityBreakdown.high}     total={total} color="bg-orange-400" />
            <SeverityBar label="Medium"   count={severityBreakdown.medium}   total={total} color="bg-yellow-400" />
            <SeverityBar label="Low"      count={severityBreakdown.low}      total={total} color="bg-green-500" />
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Resolution Status" icon={Activity} iconColor="text-blue-500">
          <div className="space-y-3">
            <SeverityBar label="Pending"   count={statusBreakdown.pending}       total={total} color="bg-amber-400" />
            <SeverityBar label="Verified"  count={statusBreakdown.verified}      total={total} color="bg-blue-400" />
            <SeverityBar label="Treated"   count={statusBreakdown.treated}       total={total} color="bg-green-500" />
            <SeverityBar label="False +"   count={statusBreakdown.falsePositive} total={total} color="bg-muted-foreground/30" />
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Scan Type Split" icon={Stethoscope} iconColor="text-violet-500">
          <div className="space-y-3">
            <SeverityBar label="Crop"      count={cropScans}      total={total} color="bg-green-500" />
            <SeverityBar label="Livestock" count={livestockScans} total={total} color="bg-amber-500" />
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Top Detected Diseases" icon={TrendingUp} iconColor="text-violet-500">
          {topDiseases.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No disease data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topDiseases.map(([disease, count], i) => (
                <div key={disease} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground flex-1 truncate">{disease}</span>
                  <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </AnalyticsCard>
      </div>

      {/* Recent scans widget */}
      <DiseaseSummaryWidget farmId={currentFarm.farm.id} />
    </div>
  );
}