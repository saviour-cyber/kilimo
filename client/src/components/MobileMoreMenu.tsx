import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { X, Settings, User, CreditCard, Users, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm } from "@/contexts/FarmContext";
import { useGrantedModules } from "@/hooks/useEntitlement";
import { getVisibleModules, SIDEBAR_SECTION_LABELS, SIDEBAR_SECTION_ORDER } from "@/lib/moduleRegistry";
import { getSidebarServices } from "@/lib/serviceRegistry";

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
}

const ACCOUNT_LINKS = [
  { label: "My Profile",             href: "/settings/user/profile",        icon: User },
  { label: "Organization",           href: "/settings/organization/profile", icon: Building },
  { label: "Team & Permissions",     href: "/settings/organization/team",    icon: Users },
  { label: "Subscription & Billing", href: "/settings/organization/billing", icon: CreditCard },
  { label: "Settings",               href: "/settings/user/profile",         icon: Settings },
];

export function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const [location] = useLocation();
  const { enabledModules, role } = useFarm();
  const { modules: grantedModules } = useGrantedModules();

  const effectiveModules = enabledModules.filter((m) => grantedModules.includes(m));
  const visibleModules = getVisibleModules(effectiveModules, role);
  const platformServices = getSidebarServices().filter((s) => grantedModules.includes(s.key));

  useEffect(() => {
    if (!open) return;
    const handlePopState = () => onClose();
    window.addEventListener("popstate", handlePopState);
    window.history.pushState({ mobileMore: true }, "");
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onClose]);

  // Close sheet automatically when route changes
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-2xl flex flex-col max-h-[85dvh] pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h2 className="text-base font-bold text-foreground">More</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-5">

          {/* Dynamic module + service sections (skip "overview" — Dashboard lives in bottom bar) */}
          {SIDEBAR_SECTION_ORDER.filter((s) => s !== "overview").map((section) => {
            const sectionModules = visibleModules.filter((m) => m.sidebarSection === section);
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
                  {sectionModules.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = location.startsWith(mod.basePath);
                    return (
                      <Link key={mod.key} href={mod.basePath}>
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
                  {sectionServices.map((service) => {
                    if (!service.icon || !service.basePath) return null;
                    const Icon = service.icon;
                    const isActive = location.startsWith(service.basePath);
                    return (
                      <Link key={service.key} href={service.basePath}>
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

          {/* Account — always shown */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">
              Account
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
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}