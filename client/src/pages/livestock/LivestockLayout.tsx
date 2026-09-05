import { PawPrint } from "lucide-react";
import { Link, useLocation } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";

const LIVESTOCK_TABS = [
  { label: "Animals", path: "/livestock/animals" },
  { label: "Herds & Groups", path: "/livestock/herds" },
  { label: "Heat & Gestation", path: "/livestock/heat-gestation" },
  { label: "Movements", path: "/livestock/movements" },
  { label: "Commercial", path: "/livestock/commercial" },
  { label: "Health Logs", path: "/livestock/health" },
  { label: "Feed Records", path: "/livestock/feed" },
  { label: "Production", path: "/livestock/production" },
  { label: "Breeding", path: "/livestock/breeding" },
  { label: "Mortality", path: "/livestock/mortality" },
];

export default function LivestockLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const active = LIVESTOCK_TABS.find((t) => location.startsWith(t.path))?.path ?? "/livestock/animals";

  return (
    <div className="px-4 sm:px-6 pt-4 pb-8 space-y-5 max-w-7xl mx-auto">
      <PageHeader 
        title="Livestock & Animal Core" 
        description="Unified animal domain, herds, reproduction, pasture movement, and health intelligence" 
        icon={PawPrint} 
      />

      <div className="flex gap-1 border-b border-border overflow-x-auto pb-0">
        {LIVESTOCK_TABS.map((tab) => (
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

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}