import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { X, Settings, User, CreditCard, Users, Building, LogOut, Download } from "lucide-react";
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

// Account / system links — always visible, not gated by entitlement
const ACCOUNT_LINKS = [
  { label: "My Profile",             href: "/settings/user/profile",        icon: User },
  { label: "Organization",           href: "/settings/organization/profile", icon: Building },
  { label: "Team & Permissions",     href: "/settings/organization/team",    icon: Users },
  { label: "Billing",                href: "/settings/organization/billing", icon: CreditCard },
  { label: "Settings",               href: "/settings/user/profile",         icon: Settings },
];

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
}

// ─── Reusable grid-box item ────────────────────────────────────────────────
function GridItem({
  href,
  label,
  icon: Icon,
  color,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  color?: string;
  isActive?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95 cursor-pointer min-h-[88px]",
          isActive
            ? "bg-primary/8 border-primary/20"
            : "bg-card border-border hover:bg-accent/60"
        )}
      >
        <Icon
          className={cn(
            "w-6 h-6",
            isActive ? "text-primary" : (color ?? "text-foreground/70")
          )}
        />
        <span
          className={cn(
            "text-[11px] font-medium text-center leading-tight",
            isActive ? "text-primary" : "text-foreground/80"
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}

export function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const [location] = useLocation();
  const { currentFarm } = useFarm();
  const role = currentFarm?.role;
  const { logout } = useAuth();

  // PWA Install Prompt
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

  // Dynamic feature list — same entitlement/RBAC filtering as desktop
  const { modules: grantedModules = [] } = useGrantedModules();
  const enabledModules = MODULE_REGISTRY.map((m) => m.key);
  const effectiveModules = enabledModules.filter((m) => grantedModules.includes(m));
  const visibleModules = getVisibleModules(effectiveModules, role ?? null);
  const platformServices = getSidebarServices().filter((s) => grantedModules.includes(s.key));
  const { moreModules } = getMobileNavSplit(visibleModules, platformServices);

  // Android back-button
  useEffect(() => {
    if (!open) return;
    const handlePopState = () => onClose();
    window.addEventListener("popstate", handlePopState);
    window.history.pushState({ mobileMore: true }, "");
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onClose]);

  // Close on route change
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl flex flex-col max-h-[92dvh]"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background rounded-t-3xl shrink-0">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-black/10" />
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between px-5 pt-2 pb-4">
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">More</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/6 hover:bg-black/10 active:scale-95 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-foreground/60" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 space-y-6">

          {/* ── Dynamic sections from registry ── */}
          {SIDEBAR_SECTION_ORDER.filter((s) => s !== "overview").map((section) => {
            const sectionModules = moreModules.filter((m) => m.sidebarSection === section);
            const sectionServices = section === "intelligence" ? platformServices : [];
            if (sectionModules.length === 0 && sectionServices.length === 0) return null;

            const label = SIDEBAR_SECTION_LABELS[section];

            return (
              <div key={section}>
                {label && (
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3 px-1">
                    {label}
                  </p>
                )}

                {/* 3-column grid — matching reference screenshot */}
                <div className="grid grid-cols-3 gap-3">
                  {sectionModules.map((mod) => {
                    const dest = mod.defaultPath ?? mod.subItems?.[0]?.path ?? mod.basePath;
                    const isActive = location.startsWith(mod.basePath);
                    return (
                      <GridItem
                        key={mod.key}
                        href={dest}
                        label={mod.label}
                        icon={mod.icon}
                        color={mod.color}
                        isActive={isActive}
                      />
                    );
                  })}

                  {sectionServices.map((service) => {
                    if (!service.icon || !service.basePath) return null;
                    const dest = (service as any).defaultPath ?? service.basePath;
                    const isActive = location.startsWith(service.basePath);
                    return (
                      <GridItem
                        key={service.key}
                        href={dest}
                        label={service.name}
                        icon={service.icon}
                        color={service.color}
                        isActive={isActive}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ── Account & System ── */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3 px-1">
              Account & System
            </p>
            <div className="grid grid-cols-3 gap-3">
              {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
                <GridItem key={href + label} href={href} label={label} icon={Icon} />
              ))}

              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-border bg-card hover:bg-accent/60 active:scale-95 transition-all min-h-[88px]"
                >
                  <Download className="w-6 h-6 text-foreground/70" />
                  <span className="text-[11px] font-medium text-center leading-tight text-foreground/80">
                    Install App
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ── Log out — full-width row at the bottom ── */}
          <button
            onClick={() => { logout(); startLogin(); }}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-red-100 bg-red-50 hover:bg-red-100 active:scale-[0.99] transition-all text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">Log out</span>
          </button>

        </div>
      </div>
    </div>
  );
}