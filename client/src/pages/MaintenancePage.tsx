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
    <div className="relative min-h-screen w-full bg-[#0a120e] text-slate-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white overflow-x-hidden">
      {/* Background radial gradient glow & ambient atmospheric mesh */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(36,107,75,0.35),rgba(10,18,14,0.95)_75%)]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(36,107,75,0.15),transparent)]" />
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#246B4B_1px,transparent_1px)] [background-size:24px_24px]" 
      />

      {/* Top Header / Brand Bar */}
      <header className="relative z-10 w-full py-6 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="KiliSense" className="h-9 w-auto object-contain" />
          <span className="text-lg font-bold tracking-tight text-white/90">KiliSense</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          System Status: Maintenance
        </div>
      </header>

      {/* Main Content Area - Full screen centered card with responsive scaling */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
          {/* Main Card Container */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-emerald-500/20 backdrop-blur-xl p-6 sm:p-10 md:p-12 shadow-2xl shadow-black/60 flex flex-col items-center text-center space-y-6 sm:space-y-8">
            
            {/* Animated Status Icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-xl animate-pulse" />
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-950/50 relative">
                <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 animate-pulse" />
              </div>
            </div>

            {/* Header Titles */}
            <div className="space-y-3 max-w-2xl">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                System Under Scheduled Maintenance
              </h1>
              <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed">
                {displayMessage}
              </p>
            </div>

            {/* Time Metadata Cards - Responsive Grid for all screens */}
            {(estimatedRestorationAt || scheduledStartAt || scheduledEndAt) && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-2 text-left">
                {estimatedRestorationAt && (
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-950/30 border border-emerald-500/30 shadow-md flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Estimated Restoration
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-white mt-1 break-words">
                        {formatDateTime(estimatedRestorationAt)}
                      </p>
                    </div>
                  </div>
                )}

                {scheduledStartAt && (
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-700/60 shadow-md flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Maintenance Window
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-slate-200 mt-1 break-words">
                        {formatDateTime(scheduledStartAt)}
                        {scheduledEndAt && (
                          <span className="block sm:inline sm:ml-1 text-slate-400 text-xs sm:text-sm font-normal">
                            to {formatDateTime(scheduledEndAt)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Information Notice Callout */}
            <div className="w-full p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs sm:text-sm text-slate-400 text-left sm:text-center leading-relaxed">
              Our engineering team is executing routine infrastructure enhancements and data optimization to deliver faster farm telemetry and reliability. Normal agricultural telemetry and livestock operations remain active on edge devices.
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#246B4B] hover:bg-[#1D583D] text-white font-medium gap-2 px-8 py-3 rounded-xl shadow-lg shadow-emerald-950/50 transition-all text-sm sm:text-base h-11 sm:h-12"
                onClick={() => {
                  if (onRefresh) onRefresh();
                  else window.location.reload();
                }}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Checking Status..." : "Check System Status"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Clean responsive footer */}
      <footer className="relative z-10 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/60 mt-auto">
        <p>© {new Date().getFullYear()} KiliSense. All rights reserved.</p>
        <p className="text-slate-400">Need urgent assistance? Contact support@kilisense.com</p>
      </footer>
    </div>
  );
}

export default MaintenancePage;
