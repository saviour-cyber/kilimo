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
    <nav className="w-64 shrink-0 flex flex-col gap-6 pb-8 sticky top-8 self-start">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-1.5">
          <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h4>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              // useLocation inside a nested route returns the nested path (e.g. /user/profile)
              // but we might also get the full path (/settings/user/profile)
              const isActive = location.endsWith(item.href.replace('/settings', '')) || location.endsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground/90" : "text-muted-foreground")} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
