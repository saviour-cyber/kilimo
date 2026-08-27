import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { X, Settings, User, CreditCard, Users, Building, LogOut, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm } from "@/contexts/FarmContext";
import { useGrantedModules } from "@/hooks/useEntitlement";
import {
  getVisibleModules,
  getMobileNavSplit,
  SIDEBAR_SECTION_LABELS,
  SIDEBAR_SECTION_ORDER,
} from "@/lib/moduleRegistry";
import { getSidebarServices } from "@/lib/serviceRegistry";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

// ─── Account / system links (always visible — not gated by entitlement) ──────
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
  const { enabledModules, role } = useFarm();
  const { modules: grantedModules } = useGrantedModules();
  const { logout } = useAuth();

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  // ── Same entitlement / RBAC logic as desktop sidebar ─────────────────────
  const effectiveModules = enabledModules.filter((m) => grantedModules.includes(m));
  const visibleModules = getVisibleModules(effectiveModules, role);
  const platformServices = getSidebarServices().filter((s) => grantedModules.includes(s.key));

  // ── Split: bottom bar gets top-N, More gets the rest ─────────────────────
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
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Bottom sheet — mobile-native, never the desktop sidebar */}
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-2xl flex flex-col max-h-[85dvh]"
           style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h2 className="text-base font-bold text-foreground">More</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-5">

          {/* ── Dynamic module + service sections (excludes "overview" which is in the bottom bar) */}
          {SIDEBAR_SECTION_ORDER.filter((s) => s !== "overview").map((section) => {
            const sectionModules = moreModules.filter((m) => m.sidebarSection === section);
            const sectionServices = section === "intelligence" ? platformServices : [];
            if (sectionModules.length === 0 && sectionServices.length === 0) return null;
            const label = SIDEBAR_SECTION_LABELS[section];

            return (
              <div key={section}>
                {label && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">
                    {label}
                  </p>
                )}
                <div className="flex flex-col gap-0.5">
                  {/* Modules */}
                  {sectionModules.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = location.startsWith(mod.basePath);
                    const dest = mod.defaultPath ?? mod.subItems?.[0]?.path ?? mod.basePath;
                    return (
                      <Link key={mod.key} href={dest}>
                        <div className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer min-h-[48px]",
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
                        )}>
                          <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : mod.color)} />
                          <span className="text-sm font-medium">{mod.label}</span>
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
                          "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer min-h-[48px]",
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
                        )}>
                          <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : (service.color ?? "text-muted-foreground"))} />
                          <span className="text-sm font-medium">{service.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ── Account & System — always visible regardless of entitlement ─── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">
              Account & System
            </p>
            <div className="flex flex-col gap-0.5">
              {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
                <Link key={href + label} href={href}>
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer min-h-[48px] hover:bg-accent text-foreground">
                    <Icon className="w-5 h-5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                </Link>
              ))}

              {/* Install App — only shown when PWA install is available */}
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer min-h-[48px] hover:bg-accent text-foreground"
                >
                  <Download className="w-5 h-5 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">Install App</span>
                </button>
              )}

              {/* Log out — always visible */}
              <button
                onClick={() => { logout(); startLogin(); }}
                className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer min-h-[48px] hover:bg-red-50 text-red-600"
              >
                <LogOut className="w-5 h-5 shrink-0 text-red-500" />
                <span className="text-sm font-medium">Log out</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}