
import { InstallCard } from "@/components/PWAInstallPrompt";

export default function PlatformAbout() {
  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-medium text-foreground tracking-tight">About KiliSense</h3>
        <p className="text-muted-foreground mt-1">Version 1.0.0 — Modern Farm Management Platform</p>
      </div>

      {/* App Installation Section */}
      <section className="space-y-4">
        <h4 className="text-lg font-medium text-foreground">App Installation</h4>
        <InstallCard />
      </section>
      
      {/* Legal & Support */}
      <section className="pt-8 border-t border-border">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact Support</a>
          <span className="text-slate-300">|</span>
          <span>© {new Date().getFullYear()} KiliSense Next. All rights reserved.</span>
        </div>
      </section>
    </div>
  );
}
