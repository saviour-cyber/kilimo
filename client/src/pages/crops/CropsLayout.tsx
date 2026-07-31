import { Leaf } from "lucide-react";
import { Link, useLocation } from "wouter";

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
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Crops</h1>
          <p className="text-xs text-muted-foreground">Field management, planting, and harvesting</p>
        </div>
      </div>

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
