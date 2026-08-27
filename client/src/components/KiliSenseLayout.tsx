import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useFarm } from "@/contexts/FarmContext";
import { getVisibleModules, MODULE_REGISTRY, SIDEBAR_SECTION_LABELS, SIDEBAR_SECTION_ORDER } from "@/lib/moduleRegistry";
import { getSidebarServices, getFloatingWidgets, type PlatformServiceDefinition } from "@/lib/serviceRegistry";
import { trpc } from "@/lib/trpc";
import { useGrantedModules } from "@/hooks/useEntitlement";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Leaf,
  LogOut,
  Menu,
  Plus,
  User,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

import { InstallSidebarButton } from "./PWAInstallPrompt";
import { MobileMoreMenu } from "./MobileMoreMenu";

interface KiliSenseLayoutProps {
  children: React.ReactNode;
}

function FarmSwitcher() {
  const { currentFarm, farms, switchFarm, role } = useFarm();

  if (!currentFarm) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors group">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {currentFarm.farm.name}
            </p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{role}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40 shrink-0 group-hover:text-sidebar-foreground/70 transition-colors" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Your Farms</DropdownMenuLabel>
        {farms.map(({ farm, role: farmRole }) => (
          <DropdownMenuItem
            key={farm.id}
            onClick={() => switchFarm(farm.id)}
            className={cn("gap-2", currentFarm.farm.id === farm.id && "bg-accent")}
          >
            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{farm.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{farmRole}</p>
            </div>
            {currentFarm.farm.id === farm.id && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/farms/new" className="gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Create New Farm</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavItem({
  mod,
  collapsed,
}: {
  mod: ReturnType<typeof MODULE_REGISTRY[0]["icon"]> extends React.FC ? never : (typeof MODULE_REGISTRY)[number];
  collapsed: boolean;
}) {
  const [location] = useLocation();
  const isActive = location.startsWith(mod.basePath);
  const [expanded, setExpanded] = useState(isActive);
  const Icon = mod.icon;
  const hasSubItems = mod.subItems && mod.subItems.length > 0;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={mod.subItems?.[0]?.path ?? mod.basePath}>
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg mx-auto transition-all duration-150",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">{mod.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      {hasSubItems ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">{mod.label}</span>
          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-200", expanded && "rotate-90")} />
        </button>
      ) : (
        <Link href={mod.subItems?.[0]?.path ?? mod.basePath}>
          <div
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{mod.label}</span>
          </div>
        </Link>
      )}
      {hasSubItems && expanded && (
        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
          {mod.subItems!.map((sub) => (
            <Link key={sub.path} href={sub.path}>
              <div
                className={cn(
                  "px-2 py-1.5 rounded-md text-xs transition-all duration-150",
                  location === sub.path
                    ? "text-sidebar-primary font-semibold"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
                )}
              >
                {sub.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** A sidebar nav item specifically for Platform Services (uses `name` instead of `label`) */
function ServiceNavItem({ service, collapsed }: { service: PlatformServiceDefinition; collapsed: boolean }) {
  const [location] = useLocation();
  const Icon = service.icon!;
  const isActive = !!service.basePath && location.startsWith(service.basePath);

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={service.basePath ?? "#"}>
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg mx-auto transition-all duration-150",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">{service.name}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={service.basePath ?? "#"}>
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{service.name}</span>
      </div>
    </Link>
  );
}

function GlobalAnnouncementBanner() {
  const { data: announcements } = trpc.system.getActiveAnnouncements.useQuery(undefined, { refetchInterval: 60000 });
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (!announcements || announcements.length === 0) return null;

  const activeAnnouncements = announcements.filter(a => !dismissed.includes(a.id));
  
  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="flex flex-col w-full z-50">
      {activeAnnouncements.map(ann => {
        const isCritical = ann.type === 'critical';
        const isWarning = ann.type === 'warning';
        const isFeature = ann.type === 'feature';
        
        return (
          <div 
            key={ann.id} 
            className={cn(
              "px-4 py-2 flex items-center justify-between text-sm shadow-sm",
              isCritical ? "bg-rose-600 text-white" :
              isWarning ? "bg-amber-500 text-white" :
              isFeature ? "bg-emerald-600 text-white" :
              "bg-sky-600 text-white"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide uppercase text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
                {ann.type}
              </span>
              <span className="font-semibold">{ann.title}:</span>
              <span>{ann.content}</span>
            </div>
            <button 
              onClick={() => setDismissed([...dismissed, ann.id])}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function KiliSenseLayout({ children }: KiliSenseLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { currentFarm, enabledModules, role, isLoading: farmLoading } = useFarm();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [location] = useLocation();

  const { data: notifCount } = trpc.notifications.unreadCount.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id, refetchInterval: 30000 }
  );

  const { modules: grantedModules, isLoading: modulesLoading } = useGrantedModules();

  if (loading || farmLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 bg-sidebar border-r border-sidebar-border p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-sidebar-accent" />
          ))}
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-sm mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Leaf className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">KiliSense Next</h1>
            <p className="text-muted-foreground mt-2 text-sm">Enterprise farm management platform</p>
          </div>
          <Button onClick={() => window.location.href = "/login"} size="lg" className="w-full">
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }
  
  // A module is enabled if the farm enabled it AND the org's subscription grants it
  const effectiveModules = enabledModules.filter(m => grantedModules.includes(m));
  
  const visibleModules = getVisibleModules(effectiveModules, role);
  
  // Filter platform services to only those granted by the subscription
  const platformServices = getSidebarServices().filter(s => grantedModules.includes(s.key));
  const floatingWidgets = getFloatingWidgets();

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* 1. Header (Fixed) */}
      <div className={cn("flex flex-col shrink-0", collapsed ? "items-center" : "")}>
        {/* Logo */}
        <div className={cn("flex items-center gap-2.5 px-3 py-3 shrink-0", collapsed && "justify-center px-2")}>
          <img src="/logo.png" alt="KiliSense" className={cn("object-contain shrink-0", collapsed ? "h-8 w-8" : "h-8")} />
          {!collapsed && (
            <div>
              <span className="font-bold text-sidebar-foreground text-sm leading-tight">KiliSense</span>
              <span className="block text-[10px] text-sidebar-foreground/40 leading-tight uppercase tracking-widest">Next</span>
            </div>
          )}
        </div>

      <Separator className="bg-sidebar-border" />

      {/* Farm Switcher */}
      {!collapsed && (
        <div className="px-3 py-3 shrink-0">
          <FarmSwitcher />
        </div>
      )}
      
      {collapsed && (
        <div className="py-3 flex justify-center shrink-0">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary" />
          </div>
        </div>
      )}

      <Separator className="bg-sidebar-border" />
      </div>

      {/* 2. Middle Content (Scrollable) */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <nav className={cn("space-y-0.5 py-4", collapsed ? "px-1.5" : "px-3")}>
          {SIDEBAR_SECTION_ORDER.map((section) => {
            // Modules from the registry that belong to this section
            const sectionModules = visibleModules.filter(m => m.sidebarSection === section);

            // Platform services slotted into the intelligence section
            const sectionServices = section === "intelligence"
              ? platformServices
              : [];

            if (sectionModules.length === 0 && sectionServices.length === 0) return null;

            const sectionLabel = SIDEBAR_SECTION_LABELS[section];

            return (
              <div key={section}>
                {/* Section header Ã¢â‚¬â€ omitted for "overview" and when collapsed */}
                {!collapsed && sectionLabel && (
                  <div className="mt-4 mb-1.5 px-3 text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                    {sectionLabel}
                  </div>
                )}
                {sectionModules.map((mod) => (
                  <NavItem key={mod.key} mod={mod as any} collapsed={collapsed} />
                ))}
                {sectionServices.map((service) => (
                  <ServiceNavItem key={service.key} service={service} collapsed={collapsed} />
                ))}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* 3. Footer (Fixed) */}
      <div className="shrink-0 flex flex-col border-t border-sidebar-border p-3 gap-2">
        
        <InstallSidebarButton collapsed={collapsed} />

        {/* User Profile */}
        <div className={cn("shrink-0", collapsed && "flex justify-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-2.5 w-full rounded-lg p-2 hover:bg-sidebar-accent transition-colors",
                collapsed && "w-10 h-10 justify-center p-0"
              )}>
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "User"}</p>
                    <p className="text-[11px] text-sidebar-foreground/50 truncate">{user?.email ?? ""}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "center" : "end"} side="top" className="w-56 mb-2">
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/user/profile" className="gap-3 cursor-pointer py-2.5">
                  <User className="w-4 h-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive gap-3 py-2.5">
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out shrink-0 z-10",
          sidebarCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center gap-3 px-4 shrink-0">
          {/* Desktop sidebar collapse toggle Ã¢â‚¬â€ hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1" />

          </header>

        <GlobalAnnouncementBanner />

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-auto">
          {currentFarm ? (
            children
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-sm mx-auto p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Leaf className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Welcome to KiliSense</h2>
                <p className="text-muted-foreground text-sm">Create your first farm to get started managing your agricultural operations.</p>
                <Button asChild>
                  <Link href="/farms/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Farm
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        {currentFarm && (
          <nav className="lg:hidden flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm pb-safe shrink-0 h-16">
            {visibleModules.slice(0, 4).map((mod) => {
              const Icon = mod.icon;
              const isActive = location.startsWith(mod.basePath);
              return (
                <Link key={mod.key} href={mod.subItems?.[0]?.path ?? mod.basePath}>
                  <div className={cn("flex flex-col items-center justify-center flex-1 h-16 px-2 gap-1 transition-colors", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium leading-none whitespace-nowrap">{mod.label}</span>
                  </div>
                </Link>
              );
            })}
            {/* More Ã¢â‚¬â€ opens dedicated MobileMoreMenu, NOT the desktop sidebar */}
            <button
              onClick={() => setMobileMoreOpen(true)}
              className="flex flex-col items-center justify-center flex-1 h-16 px-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">More</span>
            </button>
          </nav>
        )}

        {/* Mobile More Sheet Ã¢â‚¬â€ dedicated mobile-only nav, never the desktop sidebar */}
        <MobileMoreMenu open={mobileMoreOpen} onClose={() => setMobileMoreOpen(false)} />

      </div>

      {floatingWidgets.map((Widget, idx) => (
        <Widget key={idx} />
      ))}
    </div>
  );
}
