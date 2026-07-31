import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  BarChart3,
  Beef,
  CheckSquare,
  DollarSign,
  Layers,
  Package,
  Shield,
  Sprout,
  TrendingUp,
  Users,
} from "lucide-react";

const FEATURES = [
  { icon: Sprout, label: "Crop Management", desc: "Track fields, plantings, harvests, and yield analytics", color: "bg-green-100 text-green-700" },
  { icon: Beef, label: "Livestock", desc: "Animal registry, health logs, breeding, and production", color: "bg-amber-100 text-amber-700" },
  { icon: Package, label: "Inventory", desc: "Inputs, equipment, stock transactions, and suppliers", color: "bg-blue-100 text-blue-700" },
  { icon: DollarSign, label: "Finance", desc: "Income, expenses, budgets, and P&L reports", color: "bg-violet-100 text-violet-700" },
  { icon: CheckSquare, label: "Tasks", desc: "Farm activity management with priority and due dates", color: "bg-orange-100 text-orange-700" },
  { icon: BarChart3, label: "Analytics", desc: "Recharts-powered dashboards and KPI widgets", color: "bg-rose-100 text-rose-700" },
  { icon: Users, label: "Multi-tenant", desc: "Multiple farms with isolated data and team roles", color: "bg-teal-100 text-teal-700" },
  { icon: Shield, label: "RBAC", desc: "Owner, Manager, Worker, and Viewer role hierarchy", color: "bg-slate-100 text-slate-700" },
  { icon: Layers, label: "Module Registry", desc: "Enable or disable modules per farm dynamically", color: "bg-indigo-100 text-indigo-700" },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Sprout className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">KilimoHub</span>
          </div>
          <div className="flex items-center gap-3">
            {!loading && !isAuthenticated && (
              <Button onClick={() => navigate("/login")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Sign In
              </Button>
            )}
            {!loading && isAuthenticated && (
              <Button onClick={() => navigate("/dashboard")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-6">
          <TrendingUp className="w-3.5 h-3.5" />
          Production-ready farm management platform
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground leading-tight mb-6">
          Manage every aspect<br />
          <span className="text-emerald-600">of your farm</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          KilimoHub is a comprehensive, multi-tenant agricultural management platform. Track crops, livestock, inventory, and finances — all in one elegant, role-aware workspace.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-base font-semibold"
            onClick={() => navigate("/register")}
          >
            Get Started Free
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base" onClick={() => navigate("/dashboard")}>
            View Demo
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything your farm needs</h2>
          <p className="text-muted-foreground">Nine integrated modules, one unified platform</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.label} className="bg-white rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center">
              <Sprout className="w-3 h-3 text-white" />
            </div>
            <span>KilimoHub Next</span>
          </div>
          <span>Agricultural Management Platform</span>
        </div>
      </footer>
    </div>
  );
}
