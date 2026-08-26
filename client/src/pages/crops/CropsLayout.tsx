import { Leaf } from "lucide-react";
import { Link, useLocation } from "wouter";

import { PageHeader } from "@/components/shared/PageHeader";

const CROPS_TABS = [
  { label: "Fields", path: "/crops/fields" },
  { label: "Plantings", path: "/crops/plantings" },
  { label: "Harvests", path: "/crops/harvests" },
  { label: "Incidents", path: "/crops/incidents" },
  { label: "Calendar", path: "/crops/calendar" },
  { label: "Analytics", path: "/crops/analytics" },
];

export default function CropsLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const active = CROPS_TABS.find((t) => location.startsWith(t.path))?.path ?? "/crops/fields";

  return (
    <div className="px-4 sm:px-6 pt-4 pb-8 space-y-4 max-w-7xl mx-auto">
      <PageHeader 
        title="Crops" 
        description="Field management, planting, and harvesting" 
        icon={Leaf} 
      />

      <div className="flex gap-1 border-b border-border overflow-x-auto pb-0">
        {CROPS_TABS.map((tab) => (
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
