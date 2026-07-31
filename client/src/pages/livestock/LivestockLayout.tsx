import { PawPrint } from "lucide-react";
import { Link, useLocation } from "wouter";

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
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
          <PawPrint className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Livestock</h1>
          <p className="text-xs text-muted-foreground">Animals, health, feeding, and production</p>
        </div>
      </div>

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

      {children}
    </div>
  );
}
