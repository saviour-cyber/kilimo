import { trpc } from "@/lib/trpc";
import { AlertTriangle, Activity, CheckCircle, Clock, Stethoscope, ShieldAlert } from "lucide-react";

// ─── Shared helpers ───────────────────────────────────────────────────────────
function severityColor(severity: string | null) {
  switch (severity) {
    case "critical": return "text-red-600 bg-red-50 border-red-200";
    case "high":     return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium":   return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low":      return "text-green-600 bg-green-50 border-green-200";
    default:         return "text-slate-500 bg-slate-50 border-slate-200";
  }
}

function severityBadge(severity: string | null) {
  switch (severity) {
    case "critical": return "bg-red-100 text-red-700 border border-red-200";
    case "high":     return "bg-orange-100 text-orange-700 border border-orange-200";
    case "medium":   return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "low":      return "bg-green-100 text-green-700 border border-green-200";
    default:         return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "verified":       return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    case "treated":        return <Activity className="w-3.5 h-3.5 text-blue-500" />;
    case "false_positive": return <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />;
    default:               return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  }
}

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Disease KPI Widget ───────────────────────────────────────────────────────
export function DiseaseKpiWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.disease.getSummary.useQuery({ farmId });

  if (isLoading) return <Skeleton className={cn("h-[90px] rounded-xl", className)} />;

  const total = data?.total ?? 0;
  const pending = data?.pending ?? 0;
  const critical = data?.critical ?? 0;

  return (
    <Card className={cn("border shadow-sm bg-white", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-100 shrink-0">
            <Stethoscope className="w-4 h-4 text-violet-700" />
          </div>
          <span className="text-sm font-semibold text-slate-600 truncate">Disease Scans</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900">{total}</div>
            <div className="text-xs text-slate-500 mt-1">{pending} pending review</div>
          </div>
          {critical > 0 && (
            <div className="text-right">
              <div className="text-xs font-bold text-red-600">{critical} Critical</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Disease Summary Widget ───────────────────────────────────────────────────
export function DiseaseSummaryWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.disease.getSummary.useQuery({ farmId });

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className ?? ""}`}>
        <div className="h-5 w-40 bg-slate-100 rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const recentScans = data?.recentScans ?? [];

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-violet-600" />
          </div>
          <span className="font-semibold text-slate-800 text-sm">Recent Disease Scans</span>
        </div>
        <a href="/disease/history" className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">
          View All →
        </a>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        {recentScans.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-1">
              <Stethoscope className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No scans yet</p>
            <p className="text-xs text-slate-500">Upload an image to run a disease detection scan.</p>
            <a
              href="/disease/scan"
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors"
            >
              Run First Scan
            </a>
          </div>
        ) : (
          recentScans.map((scan) => (
            <div
              key={scan.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${severityColor(scan.severity)} transition-all hover:opacity-90`}
            >
              <div className="mt-0.5">{statusIcon(scan.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-800">{scan.detectedDisease ?? "Analyzing…"}</p>
                <p className="text-xs text-slate-500 capitalize mt-0.5">{scan.scanType} • {new Date(scan.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0 ${severityBadge(scan.severity)}`}>
                {scan.severity}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
