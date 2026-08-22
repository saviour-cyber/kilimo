import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  User, Lock, Bell, 
  Building, MapPin, Users,
  Layers, Cpu, LayoutDashboard, FileText,
  Code, CreditCard
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  disabled?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "User Settings",
    items: [
      { label: "My Profile", href: "/settings/user/profile", icon: User },
      { label: "Security", href: "/settings/user/security", icon: Lock },
      { label: "Notifications", href: "/settings/user/notifications", icon: Bell },
    ]
  },
  {
    title: "Organization Settings",
    items: [
      { label: "Organization Profile", href: "/settings/organization/profile", icon: Building },
      { label: "Farms", href: "/settings/organization/farms", icon: MapPin },
      { label: "Team & Permissions", href: "/settings/organization/team", icon: Users },
      { label: "Subscription & Billing", href: "/settings/organization/billing", icon: CreditCard },
    ]
  },
  {
    title: "Platform",
    items: [
      { label: "About KiliSense", href: "/settings/platform/about", icon: FileText },
    ]
  }
];

export function SettingsSidebar() {
  const [location] = useLocation();

  return (
    <nav className="w-80 shrink-0 flex flex-col gap-8 pb-8 sticky top-8 self-start">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <h4 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {group.title}
          </h4>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              // useLocation inside a nested route returns the nested path (e.g. /user/profile)
              const nestedPath = item.href.replace("/settings", "");
              const isActive = location === nestedPath || location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.disabled ? "~" : `~${item.href}`}>
                  <a 
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all",
                      isActive 
                        ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200/50" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-slate-900" : "text-slate-500")} />
                    {item.label}
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
