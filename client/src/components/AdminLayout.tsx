import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart2,
  Bell,
  Box,
  Building2,
  CalendarDays,
  CloudSun,
  CreditCard,
  Headset,
  LayoutDashboard,
  LogOut,
  Map,
  MessageSquareWarning,
  Server,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import React from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const ADMIN_MENU = [
  { group: "Platform", items: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Organizations", href: "/admin/organizations", icon: Building2 },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  ]},
  { group: "Registry", items: [
    { label: "Business Modules", href: "/admin/modules", icon: Box },
    { label: "Platform Services", href: "/admin/services", icon: Zap },
  ]},
  { group: "Engines", items: [
    { label: "AI Management", href: "/admin/ai", icon: Sparkles, color: "text-purple-400" },
    { label: "IoT Management", href: "/admin/iot", icon: Server, color: "text-sky-400" },
    { label: "Reports & Analytics", href: "/admin/reports", icon: BarChart2, color: "text-indigo-400" },
  ]},
  { group: "Operations", items: [
    { label: "Support Center", href: "/admin/support", icon: Headset },
    { label: "Audit Logs", href: "/admin/audit", icon: ShieldAlert },
    { label: "System Monitoring", href: "/admin/monitoring", icon: Activity },
    { label: "Announcements", href: "/admin/announcements", icon: Bell },
  ]},
  { group: "System", items: [
    { label: "Billing", href: "/admin/billing", icon: CreditCard },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ]}
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/admin/login");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") {
    return null; // Redirect in progress
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* ─── Sidebar (Deep Dark Slate) ─── */}
      <aside className="w-[280px] bg-[#0F172A] text-slate-300 flex flex-col flex-shrink-0 border-r border-[#1E293B] shadow-xl z-20">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#1E293B] bg-[#0A1016]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">Platform Admin</span>
              <span className="block text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mt-0.5">Superuser</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 py-6 px-4">
          <div className="space-y-8">
            {ADMIN_MENU.map((group) => (
              <div key={group.group}>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                  {group.group}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = item.exact 
                      ? location === item.href 
                      : location.startsWith(item.href);
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <a
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                          )}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full" />
                          )}
                          <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-emerald-400" : item.color)} />
                          {item.label}
                        </a>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A1016]/50">
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-9 h-9 border-2 border-[#1E293B]">
                <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 h-8 w-8 rounded-full"
              onClick={async () => {
                await logout();
                window.location.href = "/admin/login";
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 shadow-sm z-10 sticky top-0 shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">
            {ADMIN_MENU.flatMap(g => g.items).find(i => 
              i.exact ? location === i.href : location.startsWith(i.href)
            )?.label || "Admin Panel"}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md font-mono">Platform Administration</span>
          </div>
        </header>

        {/* Page Content */}
        <ScrollArea className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
