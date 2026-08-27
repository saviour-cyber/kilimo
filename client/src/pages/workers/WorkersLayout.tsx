import { Users } from "lucide-react";
import { Link, useLocation } from "wouter";

import { PageHeader } from "@/components/shared/PageHeader";

const WORKERS_TABS = [
  { label: "Overview", path: "/workers/overview" },
  { label: "All Workers", path: "/workers/all" },
  { label: "Teams", path: "/workers/teams" },
  { label: "Attendance", path: "/workers/attendance" },
  { label: "Assignments", path: "/workers/assignments" },
];

export default function WorkersLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  // Handle the root /workers redirecting to overview visually, or just active matching
  const activePath = location === "/workers" ? "/workers/overview" : location;
  const active = WORKERS_TABS.find((t) => activePath.startsWith(t.path))?.path ?? "/workers/overview";

  return (
    <div className="px-4 sm:px-6 pt-4 pb-8 space-y-4 max-w-7xl mx-auto">
      <PageHeader 
        title="Workers" 
        description="Farm workforce and attendance management" 
        icon={Users} 
      />

      <div className="flex gap-1 border-b border-border overflow-x-auto pb-0">
        {WORKERS_TABS.map((tab) => (
          <Link key={tab.path} href={tab.path}>
            <button
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active === tab.path
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
