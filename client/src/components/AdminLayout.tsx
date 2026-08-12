import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart2,
  Bell,
  Box,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headset,
  LayoutDashboard,
  LogOut,
  Menu,
  Server,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  X,
  Zap,
  Mail,
  ShoppingBag,
} from "lucide-react";
import React from "react";
import { Link, useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  accent?: string; // icon colour override
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

// ─── Menu definition ─────────────────────────────────────────────────────────

const ADMIN_MENU: NavGroup[] = [
  {
    group: "Platform",
    items: [
      { label: "Dashboard",      href: "/admin",               icon: LayoutDashboard, exact: true },
      { label: "Organizations",  href: "/admin/organizations",  icon: Building2 },
      { label: "Users",          href: "/admin/users",          icon: Users },
      { label: "Subscriptions",  href: "/admin/subscriptions",  icon: CreditCard },
    ],
  },
  {
    group: "Registry",
    items: [
      { label: "Business Modules",  href: "/admin/modules",   icon: Box },
      { label: "Platform Services", href: "/admin/services",  icon: Zap },
      { label: "Marketplace",       href: "/admin/marketplace", icon: ShoppingBag },
    ],
  },
  {
    group: "Engines",
    items: [
      { label: "AI Management",       href: "/admin/ai",      icon: Sparkles, accent: "text-purple-400" },
      { label: "IoT Management",      href: "/admin/iot",     icon: Server,   accent: "text-sky-400"    },
      { label: "Reports & Analytics", href: "/admin/reports", icon: BarChart2, accent: "text-indigo-400" },
    ],
  },
  {
    group: "Operations",
    items: [
      { label: "Support Center",    href: "/admin/support",       icon: Headset   },
      { label: "Audit Logs",        href: "/admin/audit",         icon: ShieldAlert },
      { label: "System Monitoring", href: "/admin/monitoring",    icon: Activity  },
      { label: "Announcements",     href: "/admin/announcements", icon: Bell      },
      { label: "Email Center",      href: "/admin/email",         icon: Mail      },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Billing",  href: "/admin/billing",  icon: CreditCard },
      { label: "Settings", href: "/admin/settings", icon: Settings   },
    ],
  },
];

// ─── Nav list (shared by all breakpoints) ────────────────────────────────────
// Labels are shown/hidden via Tailwind responsive classes so we only render once.

function NavList({
  location,
  collapsed,
}: {
  location: string;
  collapsed: boolean;
}) {
  return (
    <nav className="flex flex-col gap-4 px-2 py-4">
      {ADMIN_MENU.map((group) => (
        <div key={group.group}>
          {/* Group label — hidden when icon-only */}
          <p
            className={cn(
              "mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500",
              // Tablet icon sidebar: hide
              "md:hidden",
              // Desktop expanded: show
              !collapsed ? "lg:block" : "lg:hidden",
            )}
          >
            {group.group}
          </p>

          {/* Thin divider shown when label is hidden */}
          <div
            className={cn(
              "mb-2 mx-1 h-px bg-white/[0.06]",
              // Only visible in icon-only modes
              "hidden md:block",
              !collapsed ? "lg:hidden" : "lg:block",
            )}
          />

          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive = item.exact
                ? location === item.href
                : location.startsWith(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <a
                    title={item.label}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-sm font-medium",
                      "transition-colors duration-150",
                      isActive
                        ? "bg-emerald-500/[0.14] text-emerald-400"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
                      // Icon-only: center icon
                      "md:justify-center md:px-0",
                      !collapsed ? "lg:justify-start lg:px-2" : "lg:justify-center lg:px-0",
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-emerald-400 md:hidden lg:block" />
                    )}

                    {/* Icon */}
                    <item.icon
                      className={cn(
                        "shrink-0 transition-transform duration-150 group-hover:scale-105",
                        "w-[18px] h-[18px]",
                        isActive
                          ? "text-emerald-400"
                          : (item.accent ?? "text-slate-400 group-hover:text-slate-200"),
                      )}
                    />

                    {/* Label — hidden in icon-only modes */}
                    <span
                      className={cn(
                        "truncate leading-none",
                        // Tablet: always hidden
                        "md:hidden",
                        // Desktop: depends on collapsed
                        !collapsed ? "lg:inline" : "lg:hidden",
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Active dot — only in expanded mode */}
                    {isActive && (
                      <span
                        className={cn(
                          "ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400",
                          "md:hidden",
                          !collapsed ? "lg:block" : "lg:hidden",
                        )}
                      />
                    )}
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ─── Main layout ─────────────────────────────────────────────────────────────

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, loading } = useAuth();
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const previousLocation = useRef(location);

  // Auth guard
  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") navigate("/admin/login");
  }, [user, loading, navigate]);

  // Auto-close mobile drawer on navigation
  useEffect(() => {
    if (location !== previousLocation.current) {
      setDrawerOpen(false);
      previousLocation.current = location;
    }
  }, [location]);

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-4 h-4 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading admin console…</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const initials = (user.name ?? "PA")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">

      {/* ── Mobile backdrop overlay ── */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300",
          "md:hidden",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* ──────────────────────────────────────────
          SIDEBAR
          Mobile  : fixed off-canvas drawer, 78 vw, max 280 px
          Tablet  : always visible, 64 px wide, icon-only
          Desktop : 224 px expanded / 64 px collapsed
      ──────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-border bg-card",
          "transition-transform duration-300 ease-in-out",
          // Mobile base
          "w-[78vw] max-w-[280px]",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          // Tablet: always visible, icon-only width
          "md:relative md:translate-x-0 md:w-16",
          // Desktop: full width or collapsed
          collapsed ? "lg:w-16" : "lg:w-56",
        )}
      >
        {/* ── Sidebar header ── */}
        <div className="flex h-[60px] shrink-0 items-center border-b border-border px-3 gap-2.5">
          {/* Logo mark */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
            <ShieldAlert className="h-3.5 w-3.5 text-primary-foreground" />
          </div>

          {/* Brand name — visible on mobile drawer + desktop expanded */}
          <span
            className={cn(
              "truncate text-sm font-semibold tracking-tight text-foreground",
              "md:hidden",
              !collapsed ? "lg:block" : "lg:hidden",
            )}
          >
            Platform Admin
          </span>

          {/* Mobile close */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "hidden ml-auto h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              "lg:flex",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft className="h-3.5 w-3.5" />
            }
          </button>
        </div>

        {/* ── Nav scroll area ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
          <NavList location={location} collapsed={collapsed} />
        </div>

        {/* ── User footer ── */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-2.5 border-t border-border p-3",
            (collapsed) && "lg:justify-center",
            "md:justify-center",
          )}
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground border border-border">
            {initials}
          </div>

          {/* Name + email — hidden in icon-only modes */}
          <div
            className={cn(
              "min-w-0 flex-1",
              "md:hidden",
              !collapsed ? "lg:block" : "lg:hidden",
            )}
          >
            <p className="truncate text-xs font-medium text-foreground">{user.name ?? "Admin"}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>

          {/* Logout button */}
          <button
            onClick={async () => { await logout(); window.location.href = "/admin/login"; }}
            title="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* ──────────────────────────────────────────
          MAIN CONTENT AREA
      ──────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* ── Top header bar ── */}
        <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile brand */}
          <span className="text-sm font-semibold text-foreground md:hidden">Platform Admin</span>

          <div className="flex-1" />

          {/* Search bar — tablet+ */}
          <div className="hidden md:flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-muted-foreground w-52 lg:w-64">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs flex-1">Quick search…</span>
            <kbd className="rounded bg-secondary px-1 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
          </div>

          {/* Notifications */}
          <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          {/* User — tablet+ */}
          <div className="hidden md:flex items-center gap-2 border-l border-border pl-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground border border-border">
              {initials}
            </div>
          </div>
        </header>

        {/* ── Scrollable page content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] p-4 md:p-5 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
