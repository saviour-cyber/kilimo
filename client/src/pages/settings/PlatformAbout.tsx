import { MonitorPlay, ShieldCheck, Cpu } from "lucide-react";
import { InstallCard } from "@/components/PWAInstallPrompt";

export default function PlatformAbout() {
  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-medium text-slate-900 tracking-tight">About SproutX</h3>
        <p className="text-slate-500 mt-1">Version 1.0.0 — Modern Farm Management Platform</p>
      </div>

      {/* App Installation Section */}
      <section className="space-y-4">
        <h4 className="text-lg font-medium text-slate-900">App Installation</h4>
        <InstallCard />
      </section>

      {/* System Information */}
      <section className="space-y-4 pt-4">
        <h4 className="text-lg font-medium text-slate-900">System Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 text-sm">Secure Connection</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Your data is encrypted end-to-end and stored securely in our enterprise-grade infrastructure.</p>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-3">
            <Cpu className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 text-sm">IoT Engine Active</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Real-time telemetry and automation services are currently online and processing events.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Legal & Support */}
      <section className="pt-8 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Contact Support</a>
          <span className="text-slate-300">|</span>
          <span>© {new Date().getFullYear()} SproutX Next. All rights reserved.</span>
        </div>
      </section>
    </div>
  );
}
