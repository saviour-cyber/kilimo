import { trpc } from "@/lib/trpc";
import { AlertTriangle, Activity, CheckCircle, Clock, Stethoscope, ShieldAlert } from "lucide-react";

// â”€â”€â”€ Shared helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function severityColor(severity: string | null) {
  switch (severity) {
    case "critical": return "text-red-600 bg-red-50 border-red-200";
    case "high":     return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium":   return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low":      return "text-green-600 bg-green-50 border-green-200";
    default:         return "text-muted-foreground bg-muted border-border";
  }
}

function severityBadge(severity: string | null) {
  switch (severity) {
    case "critical": return "bg-red-100 text-red-700 border border-red-200";
    case "high":     return "bg-orange-100 text-orange-700 border border-orange-200";
    case "medium":   return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "low":      return "bg-green-100 text-green-700 border border-green-200";
    default:         return "bg-muted text-muted-foreground border border-border";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "verified":       return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    case "treated":        return <Activity className="w-3.5 h-3.5 text-blue-500" />;
    case "false_positive": return <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />;
    default:               return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  }
}

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DiseaseKpiWidget({ farmId }: { farmId: number }) {
  const { data, isLoading } = trpc.disease.getSummary.useQuery({ farmId });

  if (isLoading) return <Skeleton className="h-[100px] rounded-2xl" />;

  const total = data?.total ?? 0;
  const critical = data?.critical ?? 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col h-[100px]">
      <span className="text-[11px] font-semibold text-violet-600 truncate mb-1">Disease Scans</span>
      <span className="text-[15px] font-bold text-slate-900 truncate flex-1">{total}</span>
      <div className="flex items-center justify-between">
        <Stethoscope className="w-4 h-4 text-violet-500" />
        {critical > 0 && (
          <span className="text-[10px] font-bold text-red-600">{critical} critical</span>
        )}
      </div>
    </div>
  );
}

export function DiseaseSummaryWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.disease.getSummary.useQuery({ farmId });

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-border shadow-sm p-5 ${className ?? ""}`}>
        <div className="h-5 w-40 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const recentScans = data?.recentScans ?? [];

  return (
    <div className={`bg-white rounded-2xl border border-border shadow-sm ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-violet-600" />
          </div>
          <span className="font-semibold text-foreground text-sm">Recent Disease Scans</span>
        </div>
        <a href="/disease/history" className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">
        <a href="/disease/history" className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">View All</a>
        </a>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        {recentScans.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-1">
              <Stethoscope className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No scans yet</p>
            <p className="text-xs text-muted-foreground">Upload an image to run a disease detection scan.</p>
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
                <p className="text-sm font-semibold truncate text-foreground">{scan.detectedDisease ?? "Analyzing..."}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{scan.scanType} &middot; {new Date(scan.createdAt).toLocaleDateString()}</p>
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

