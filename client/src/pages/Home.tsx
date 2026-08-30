import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PlanCard } from "@/components/onboarding/PlanCard";
import {
  Brain,
  CloudSun,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageSquareWarning,
  Play,
  ShoppingCart,
  Sprout,
  Twitter,
  Wallet,
  Clock,
  ArrowRight,
  Calendar,
  Leaf,
  Users,
  Star,
  Download,
  Share,
  Plus,
} from "lucide-react";

// System accent colors — exactly matching the design system tokens
const FEATURES = [
  { icon: Sprout,              label: "Farm Management",   desc: "Manage your farms, fields, crops and activities all in one place.",              color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-100" },
  { icon: ShoppingCart,        label: "Marketplace",        desc: "Buy quality farm inputs and sell your produce to trusted buyers.",                color: "text-sky-500",    bg: "bg-sky-50",      border: "border-sky-100"     },
  { icon: Brain,               label: "AI Assistant",       desc: "Get smart recommendations on crops, weather, pests and best practices.",          color: "text-purple-500", bg: "bg-purple-50",   border: "border-purple-100"  },
  { icon: MessageSquareWarning, label: "Disease Detection", desc: "Upload a photo and get AI-powered diagnosis and treatment suggestions.",           color: "text-orange-500", bg: "bg-orange-50",   border: "border-orange-100"  },
  { icon: CloudSun,            label: "Weather Updates",    desc: "Real-time weather forecasts and alerts to help you plan better.",                  color: "text-cyan-500",   bg: "bg-cyan-50",     border: "border-cyan-100"    },
  { icon: Wallet,              label: "Finance Tracking",   desc: "Track expenses, income and profits to grow your agricultural business.",           color: "text-amber-500",  bg: "bg-amber-50",    border: "border-amber-100"   },
];

import { usePWAInstall } from "@/components/PWAInstallPrompt";

export default function Home() {
  const { loading, isAuthenticated, isPlatformAdmin } = useAuth();
  const [, navigate] = useLocation();

  const isStandalone = typeof window !== 'undefined' && 
    (window.matchMedia('(display-mode: standalone)').matches || window.location.search.includes('mode=standalone'));

  const [splashFinished, setSplashFinished] = useState(!isStandalone);

  // Use the global PWA install state
  const { canInstall, isInstalled, triggerPrompt: triggerInstall } = usePWAInstall();

  // Plans data
  const { data: plans } = trpc.subscriptions.listPlans.useQuery();
  const activePlans = (plans || []).filter(p => p.isActive);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  // Splash screen timer
  useEffect(() => {
    if (isStandalone) {
      const timer = setTimeout(() => {
        setSplashFinished(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  // Routing logic
  useEffect(() => {
    if (!loading && splashFinished) {
      if (isAuthenticated) {
        // Platform Admins must NEVER be routed to the farm dashboard
        navigate(isPlatformAdmin ? "/admin" : "/dashboard");
      } else if (isStandalone) {
        // PWA users bypass landing page and go straight to login
        navigate("/login");
      }
    }
  }, [loading, isAuthenticated, isPlatformAdmin, navigate, splashFinished, isStandalone]);

  // Show splash screen for PWA
  if (isStandalone && !splashFinished) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <img src="/logo.png" alt="KiliSense Logo" className="h-48 object-contain animate-pulse" />
      </div>
    );
  }

  return (
    // System background token: #F8FAFC
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#10B981] selection:text-white">

      {/* ─── NAVBAR ─────────────────────────────────────────────────────── */}
      {/* System card token: #FFFFFF with system border: #E2E8F0 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/logo.png" alt="KiliSense" className="h-16 object-contain" />
          </div>
          <div className="flex items-center gap-6">
            {!loading && !isAuthenticated && (
              <>
                {/* Secondary text: #64748B */}
                <button
                  onClick={() => navigate("/login")}
                  className="text-sm font-semibold text-[#64748B] hover:text-[#10B981] transition-colors"
                >
                  Login
                </button>
                {/* Primary brand: #10B981 */}
                <Button
                  onClick={() => navigate("/register")}
                  className="bg-[#10B981] hover:bg-[#059669] text-white rounded-full px-6 h-10 shadow-sm transition-colors"
                >
                  Get Started
                </Button>
              </>
            )}
            {!loading && isAuthenticated && (
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-full px-6 h-10 shadow-sm transition-colors"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[700px] lg:min-h-[780px] flex items-center">
        {/* Background: rich real-world photo, faded into the system #F8FAFC background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000&auto=format&fit=crop"
            alt="Tea Farm Background"
            className="w-full h-full object-cover object-center"
          />
          {/* Fade right side into #F8FAFC, not plain white */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/92 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/60 via-transparent to-[#F8FAFC]" />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Copy */}
            <div className="max-w-xl">
              {/* Emerald badge — system primary */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-semibold mb-6 border border-[#10B981]/20">
                <Sprout className="w-3.5 h-3.5" />
                Empowering Farmers with Technology
              </div>

              {/* System primary text: #0F172A */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] leading-[1.1] mb-6 tracking-tight">
                Smart Farming <br />
                for a <span className="text-[#10B981]">Better Tomorrow</span>
              </h1>

              {/* System secondary text: #64748B */}
              <p className="text-lg text-[#64748B] mb-8 leading-relaxed">
                KiliSense is an all-in-one agriculture platform that helps farmers manage their farms, increase productivity and connect to markets.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  className="bg-[#10B981] hover:bg-[#059669] text-white rounded-full px-8 h-12 text-base font-medium shadow-md shadow-[#10B981]/20 transition-colors"
                  onClick={() => navigate("/register")}
                >
                  Get Started for Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-8 text-base font-medium border-[#E2E8F0] text-[#0F172A] hover:bg-white bg-white/80 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2 text-[#10B981] fill-[#10B981]" /> Watch Demo
                </Button>
              </div>

              {/* Trust row */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[#F8FAFC] bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">J</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#F8FAFC] bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">M</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#F8FAFC] bg-sky-100 flex items-center justify-center text-[10px] font-bold text-sky-700">A</div>
                </div>
                <p className="text-sm text-[#64748B] font-medium">
                  Trusted by <span className="font-bold text-[#0F172A]">5,000+ farmers</span> across Kenya and beyond
                </p>
              </div>
            </div>

            {/* Floating Dashboard Cards — use system card token: #FFFFFF with #E2E8F0 border */}
            <div className="relative w-full max-w-lg mx-auto lg:ml-auto">
              <div className="flex flex-col gap-4 drop-shadow-[0_20px_40px_rgba(0,0,0,0.07)]">
                {/* Card 1: Farm Overview */}
                <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-3">
                    <Sprout className="w-3.5 h-3.5 text-[#10B981]" /> Farm Overview
                  </div>
                  <div className="flex items-end gap-3 mb-4">
                    <div className="text-sm text-[#64748B] font-medium pb-1">Total Farms</div>
                    <div className="text-3xl font-bold text-[#0F172A] leading-none">3</div>
                    {/* Success color: #22C55E */}
                    <div className="text-xs font-semibold text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded pb-1">+12%</div>
                  </div>
                  {/* Chart bars in system primary */}
                  <div className="flex items-end h-8 gap-1 w-full">
                    {[30, 45, 25, 55, 42, 65, 52, 72, 80].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: i === 8 ? "#10B981" : `${["#34D399","#6EE7B7","#A7F3D0","#34D399","#6EE7B7","#A7F3D0","#34D399","#6EE7B7"][i] || "#10B981"}` }} />
                    ))}
                  </div>
                </div>

                {/* Card 2: Revenue */}
                <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm ml-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-3">
                    <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" /> Total Revenue
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-sm text-[#64748B] font-medium pb-1">KES</div>
                    <div className="text-3xl font-bold text-[#0F172A] leading-none">245,000</div>
                    <div className="text-xs font-semibold text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded pb-1">+18.5%</div>
                  </div>
                  <div className="text-[10px] text-[#94A3B8] mt-1">This Month</div>
                </div>

                {/* Card 3: Active Crops */}
                <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm ml-8">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-3">
                    <Leaf className="w-3.5 h-3.5 text-[#0EA5E9]" /> Active Crops
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-3xl font-bold text-[#0F172A] leading-none">8</div>
                    <div className="text-xs font-semibold text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded pb-1">+2</div>
                  </div>
                  <div className="text-[10px] text-[#94A3B8] mt-1">This Season</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      {/* System background: #F8FAFC */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-sm font-bold tracking-widest text-[#10B981] uppercase mb-3">All-In-One Platform</h3>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] leading-tight">
              Everything You Need to Grow <br className="hidden sm:block" />
              <span className="text-[#10B981]">Your Farm, Your Way</span>
            </h2>
          </div>

          {/* Cards — system white + system border */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex gap-5 group hover:shadow-md hover:border-[#10B981]/30 transition-all duration-200"
              >
                <div className={`w-14 h-14 shrink-0 rounded-2xl ${f.bg} border ${f.border} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#0F172A] mb-1.5">{f.label}</h4>
                  <p className="text-[#64748B] leading-relaxed text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS BANNER ────────────────────────────────────────────────── */}
      {/* System sidebar color: #0F172A — same deep slate as the app sidebar */}
      <section className="bg-[#0F172A] py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { Icon: Users,   stat: "5,000+", label: "Happy Farmers",     accent: "#10B981" },
              { Icon: MapPin,  stat: "20+",    label: "Counties Covered",   accent: "#10B981" },
              { Icon: Sprout,  stat: "50+",    label: "Crops Supported",    accent: "#10B981" },
              { Icon: Star,    stat: "100%",   label: "Customer Support",   accent: "#10B981" },
            ].map(({ Icon, stat, label, accent }) => (
              <div key={label} className="flex flex-col items-start lg:items-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${accent}20` }}>
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <div className="text-4xl font-bold text-white mb-1">{stat}</div>
                <div className="text-xs font-bold tracking-widest uppercase" style={{ color: `${accent}cc` }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────────────── */}
      {activePlans.length > 0 && (
        <section className="py-24 bg-white" id="pricing">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h3 className="text-sm font-bold tracking-widest text-[#10B981] uppercase mb-3">Simple Pricing</h3>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] leading-tight mb-8">
                Choose the Right Plan <br className="hidden sm:block" />
                <span className="text-[#10B981]">for Your Farm</span>
              </h2>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-3 p-1 bg-muted rounded-lg w-fit mx-auto">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    billingInterval === "monthly"
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    billingInterval === "yearly"
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Yearly
                  <div className="bg-emerald-100 text-emerald-700 text-xs py-0.5 px-2 rounded-full font-semibold">Save up to 20%</div>
                </button>
              </div>
            </div>

            <div className={`grid gap-8 max-w-6xl mx-auto ${
              activePlans.length === 1 ? "grid-cols-1 max-w-md" :
              activePlans.length === 2 ? "md:grid-cols-2 max-w-3xl" :
              "lg:grid-cols-3"
            }`}>
              {activePlans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan as any}
                  billingInterval={billingInterval}
                  ctaLabel="Get Started"
                  onCta={() => navigate("/register")}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA SECTION ─────────────────────────────────────────────────── */}
      {/* System bg, then CTA box uses primary #10B981 */}

      <section className="bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div
            className="rounded-2xl overflow-hidden relative flex flex-col md:flex-row items-center justify-between shadow-lg bg-primary"
          >
            {/* Subtle decorative circle */}
            <div className="absolute right-24 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-10 bg-white pointer-events-none" />

            <div className="p-10 lg:p-16 z-10 max-w-xl">
              <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
                Join thousands of smart farmers already growing with KiliSense
              </h2>
              <Button
                size="lg"
                className="bg-white hover:bg-[#F8FAFC] text-[#059669] font-semibold rounded-full px-8 h-12 text-base shadow-md transition-colors"
                onClick={() => navigate("/register")}
              >
                Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Simulated UI snippet */}
            <div className="hidden md:flex items-end justify-end self-stretch pr-10 pb-0 z-10">
              <div className="bg-white rounded-t-2xl shadow-2xl w-56 p-5 flex flex-col gap-3">
                <div className="w-20 h-2.5 bg-[#E2E8F0] rounded-full" />
                <div className="w-full h-10 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]" />
                <div className="w-3/4 h-2.5 bg-[#E2E8F0] rounded-full" />
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full bg-[#10B981]/20" />
                  <div className="w-24 h-2 bg-[#E2E8F0] rounded-full" />
                </div>
                <div className="w-full h-10 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]" />
                <div className="w-full h-10 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      {/* System sidebar: #0F172A — seamlessly matches the in-app sidebar */}
      <footer className="bg-[#0F172A] pt-20 pb-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">

            {/* Brand column */}
            <div className="lg:col-span-4">
              <img src="/logo.png" alt="KiliSense" className="h-12 object-contain mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">KiliSense</h3>
              <p className="text-[#64748B] mb-8 max-w-sm text-sm leading-relaxed">
                Helping African farmers manage farms, access markets and grow with confidence.
              </p>
              <div className="flex items-center gap-3">
                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full flex items-center justify-center text-[#64748B] border border-[#1E293B] hover:bg-[#10B981] hover:text-white hover:border-[#10B981] transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
              {/* Platform */}
              <div>
                <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-6">Platform</h4>
                <ul className="space-y-4 text-sm text-[#64748B]">
                  {["Dashboard","Farm Management","Marketplace","AI Assistant","Disease Detection","Weather Updates","Finance & Reports"].map(l => (
                    <li key={l}><a href="#" className="hover:text-[#10B981] transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              {/* Company */}
              <div>
                <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-6">Company</h4>
                <ul className="space-y-4 text-sm text-[#64748B]">
                  {["About Us","Our Mission","Careers","Blog & News","Partners","Press Kit"].map(l => (
                    <li key={l}><a href="#" className="hover:text-[#10B981] transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              {/* Support */}
              <div>
                <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-6">Support</h4>
                <ul className="space-y-4 text-sm text-[#64748B]">
                  {["Help Center","Contact Us","Privacy Policy","Terms of Service","Cookie Policy"].map(l => (
                    <li key={l}><a href="#" className="hover:text-[#10B981] transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              {/* Contact */}
              <div>
                <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-6">Contact</h4>
                <ul className="space-y-4 text-sm text-[#64748B]">
                  <li className="flex gap-3"><MapPin className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" /><span>Nairobi, Kenya</span></li>
                  <li className="flex gap-3"><Mail className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" /><span>support@KiliSensehub.co.ke</span></li>
                  <li className="flex gap-3"><Clock className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" /><span>Mon – Sat · 8:00am – 6:00pm EAT</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar — system border: #1E293B (sidebar-accent) */}
          <div className="border-t border-[#1E293B] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#64748B]">© {new Date().getFullYear()} KiliSense Technologies Ltd.</p>
            <div className="flex items-center gap-4 text-sm text-[#64748B] flex-wrap justify-center">
              {["Privacy Policy","Terms of Service","Cookie Policy"].map(l => (
                <a key={l} href="#" className="hover:text-[#10B981] transition-colors">{l}</a>
              ))}
              {/* Install App button — only shown when not already installed */}
              {!isInstalled && canInstall && (
                <button
                  onClick={triggerInstall}
                  className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

