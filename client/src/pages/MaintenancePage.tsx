import React from "react";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, Calendar, RefreshCw } from "lucide-react";

interface MaintenancePageProps {
  message?: string;
  estimatedRestorationAt?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function MaintenancePage({
  message,
  estimatedRestorationAt,
  scheduledStartAt,
  scheduledEndAt,
  onRefresh,
  isRefreshing = false,
}: MaintenancePageProps) {
  const displayMessage =
    message ||
    "We are currently performing scheduled system upgrades. Normal service will resume shortly.";

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Background radial gradient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 my-auto">
        <div className="max-w-lg w-full text-center space-y-6">
          {/* Animated Status Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-950 relative">
              <Wrench className="w-9 h-9 text-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              System Maintenance
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              {displayMessage}
            </p>
          </div>

          {/* Time Metadata Cards */}
          {(estimatedRestorationAt || scheduledStartAt || scheduledEndAt) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
              {estimatedRestorationAt && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 shadow-sm flex items-start gap-3">
                  <Clock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Estimated Restoration
                    </p>
                    <p className="text-sm font-medium text-slate-200 mt-0.5">
                      {formatDateTime(estimatedRestorationAt)}
                    </p>
                  </div>
                </div>
              )}

              {scheduledStartAt && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Maintenance Window
                    </p>
                    <p className="text-sm font-medium text-slate-300 mt-0.5">
                      {formatDateTime(scheduledStartAt)}
                      {scheduledEndAt && ` - ${formatDateTime(scheduledEndAt)}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          <div className="flex items-center justify-center pt-2">
            <Button
              variant="default"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 px-8 shadow-lg shadow-emerald-900/30"
              onClick={() => {
                if (onRefresh) onRefresh();
                else window.location.reload();
              }}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </main>

      {/* Clean minimal footer */}
      <footer className="relative z-10 py-6 px-6 text-center text-xs text-slate-500">
        <p>System upgrades in progress. Please check back shortly.</p>
      </footer>
    </div>
  );
}

export default MaintenancePage;
