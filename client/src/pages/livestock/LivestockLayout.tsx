import { PawPrint } from "lucide-react";
import { Link, useLocation } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";

const LIVESTOCK_TABS = [
  { label: "Animals", path: "/livestock/animals" },
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
        title="Livestock" 
        description="Animals, health, feeding, and production" 
        icon={PawPrint} 
      />

      <div className="flex flex-wrap gap-2">
        {LIVESTOCK_TABS.map((tab) => (
          <Link key={tab.path} href={tab.path}>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                active === tab.path
                  ? "bg-[#166534] text-white shadow-sm"
                  : "bg-card text-muted-foreground border border-border hover:bg-accent hover:text-foreground"
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