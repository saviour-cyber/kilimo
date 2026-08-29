import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { X, Settings, User, CreditCard, Users, Building, LogOut, Download, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm } from "@/contexts/FarmContext";
import { useGrantedModules } from "@/hooks/useEntitlement";
import {
  MODULE_REGISTRY,
  getVisibleModules,
  getMobileNavSplit,
  SIDEBAR_SECTION_LABELS,
  SIDEBAR_SECTION_ORDER,
} from "@/lib/moduleRegistry";
import { getSidebarServices } from "@/lib/serviceRegistry";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

// Account / system links (always visible — not gated by entitlement)
const ACCOUNT_LINKS = [
  { label: "My Profile",             href: "/settings/user/profile",        icon: User },
  { label: "Organization",           href: "/settings/organization/profile", icon: Building },
  { label: "Team & Permissions",     href: "/settings/organization/team",    icon: Users },
  { label: "Subscription & Billing", href: "/settings/organization/billing", icon: CreditCard },
  { label: "Settings",               href: "/settings/user/profile",         icon: Settings },
];

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const [location] = useLocation();
  const { currentFarm } = useFarm();
  const role = currentFarm?.role;
  const { logout } = useAuth();

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  // Build the dynamic list of accessible features exactly as desktop does
  const { modules: grantedModules = [] } = useGrantedModules();
  
  // The registry exports all modules. We filter by entitlement, then by RBAC/Farm scope
  const enabledModules = MODULE_REGISTRY.map((m) => m.key);
  const effectiveModules = enabledModules.filter((m) => grantedModules.includes(m));
  const visibleModules = getVisibleModules(effectiveModules, role ?? null);
  const platformServices = getSidebarServices().filter((s) => grantedModules.includes(s.key));

  // Split: bottom bar gets top-N, More gets the rest
  const { moreModules } = getMobileNavSplit(visibleModules, platformServices);

  // Android back-button support
  useEffect(() => {
    if (!open) return;
    const handlePopState = () => onClose();
    window.addEventListener("popstate", handlePopState);
    window.history.pushState({ mobileMore: true }, "");
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onClose]);

  // Close when route changes
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Bottom sheet — mobile-native, never the desktop sidebar */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[1.75rem] shadow-2xl flex flex-col max-h-[92dvh] transform transition-transform"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
      >
        {/* Sticky Header */}
        <div className="flex flex-col items-center sticky top-0 bg-background/95 backdrop-blur-md z-10 rounded-t-[1.75rem] border-b border-black/5 shrink-0">
          {/* Handle */}
          <div className="w-12 h-1.5 rounded-full bg-black/10 mt-3 mb-3" />
          
          <div className="w-full flex items-center justify-between px-6 pb-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full bg-primary" />
              <h2 className="text-xl font-bold font-serif text-foreground tracking-tight">More</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 active:scale-95 transition-all"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-7">

          {/* Dynamic module + service sections (excludes "overview" which is in the bottom bar) */}
          {SIDEBAR_SECTION_ORDER.filter((s) => s !== "overview").map((section) => {
            const sectionModules = moreModules.filter((m) => m.sidebarSection === section);
            const sectionServices = section === "intelligence" ? platformServices : [];
            
            if (sectionModules.length === 0 && sectionServices.length === 0) return null;
            
            const label = SIDEBAR_SECTION_LABELS[section];

            return (
              <div key={section} className="px-2">
                {label && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 px-2 mb-3">
                    {label}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {/* Modules */}
                  {sectionModules.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = location.startsWith(mod.basePath);
                    const dest = mod.defaultPath ?? mod.subItems?.[0]?.path ?? mod.basePath;
                    
                    return (
                      <Link key={mod.key} href={dest}>
                        <div className={cn(
                          "flex items-center gap-4 px-3 py-3 w-full rounded-2xl transition-all cursor-pointer",
                          isActive ? "bg-primary/5 border border-primary/10" : "active:bg-black/5 hover:bg-black/[0.02] border border-transparent"
                        )}>
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                            isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-black/5"
                          )}>
                            <Icon className={cn("w-4 h-4", isActive ? "" : mod.color)} />
                          </div>
                          <span className={cn(
                            "text-[15px] font-medium flex-1 text-left",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {mod.label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        </div>
                      </Link>
                    );
                  })}

                  {/* Platform services */}
                  {sectionServices.map((service) => {
                    if (!service.icon || !service.basePath) return null;
                    const Icon = service.icon;
                    const isActive = location.startsWith(service.basePath);
                    const dest = (service as any).defaultPath ?? service.basePath;
                    
                    return (
                      <Link key={service.key} href={dest}>
                        <div className={cn(
                          "flex items-center gap-4 px-3 py-3 w-full rounded-2xl transition-all cursor-pointer",
                          isActive ? "bg-primary/5 border border-primary/10" : "active:bg-black/5 hover:bg-black/[0.02] border border-transparent"
                        )}>
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                            isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-black/5"
                          )}>
                            <Icon className={cn("w-4 h-4", isActive ? "" : (service.color ?? "text-muted-foreground"))} />
                          </div>
                          <span className={cn(
                            "text-[15px] font-medium flex-1 text-left",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {service.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Account & System — always visible regardless of entitlement */}
          <div className="px-2 pb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 px-2 mb-3">
              Account & System
            </p>
            <div className="flex flex-col gap-1">
              {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
                <Link key={href + label} href={href}>
                  <div className="flex items-center gap-4 px-3 py-3 w-full rounded-2xl transition-all cursor-pointer active:bg-black/5 hover:bg-black/[0.02] border border-transparent">
                    <div className="w-10 h-10 rounded-full bg-card border border-black/5 shadow-sm flex items-center justify-center shrink-0 text-muted-foreground">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium flex-1 text-left text-foreground">
                      {label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </Link>
              ))}

              {/* Install App */}
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-4 px-3 py-3 w-full rounded-2xl transition-all cursor-pointer active:bg-black/5 hover:bg-black/[0.02] border border-transparent text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-card border border-black/5 shadow-sm flex items-center justify-center shrink-0 text-muted-foreground">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-[15px] font-medium flex-1 text-foreground">
                    Install App
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </button>
              )}

              {/* Log out */}
              <button
                onClick={() => { logout(); startLogin(); }}
                className="flex items-center gap-4 px-3 py-3 w-full rounded-2xl transition-all cursor-pointer active:bg-red-500/10 hover:bg-red-500/5 border border-transparent text-left mt-2"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-500">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-[15px] font-medium flex-1 text-red-600">
                  Log out
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}