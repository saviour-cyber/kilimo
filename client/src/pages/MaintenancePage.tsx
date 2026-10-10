import React from "react";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Clock,
  Calendar,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  Sprout,
  CheckCircle2,
} from "lucide-react";

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
    "We are currently performing scheduled system upgrades to improve reliability and performance. Normal service will resume shortly.";

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

      {/* Top Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                KiliSense
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                System Status
              </span>
            </div>
          </div>

          <a
            href="/admin/login"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff / Admin</span>
          </a>
        </div>
      </header>

      {/* Center Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 my-8">
        <div className="max-w-xl w-full text-center space-y-6">
          {/* Animated Status Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-950 relative">
              <Wrench className="w-9 h-9 text-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Scheduled Platform Maintenance
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              We'll be right back
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
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

          {/* Systems Status Badges */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Database Integrity Safe
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              IoT Telemetry Buffered
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Zero Data Loss Protocol
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="default"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 px-6 shadow-lg shadow-emerald-900/30"
              onClick={() => {
                if (onRefresh) onRefresh();
                else window.location.reload();
              }}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Check Status Again
            </Button>

            <a href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-slate-800 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white gap-2"
              >
                Go to Sign-in
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} KiliSense Agriculture Ltd. Nyeri, Kenya. For urgent agronomic issues, contact{" "}
          <a href="mailto:support@kilisense.com" className="text-emerald-400 hover:underline">
            support@kilisense.com
          </a>
        </p>
      </footer>
    </div>
  );
}

export default MaintenancePage;
