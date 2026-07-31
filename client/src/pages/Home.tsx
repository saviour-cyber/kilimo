import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
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
  TrendingUp,
  Calendar,
  Leaf,
  Users,
  Map,
  ShieldCheck,
  Star
} from "lucide-react";

const FEATURES = [
  { icon: Sprout, label: "Farm Management", desc: "Manage your farms, fields, crops and activities all in one place.", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: ShoppingCart, label: "Marketplace", desc: "Buy quality farm inputs and sell your produce to trusted buyers.", color: "text-sky-500", bg: "bg-sky-50" },
  { icon: Brain, label: "AI Assistant", desc: "Get smart recommendations on crops, weather, pests and best practices.", color: "text-purple-500", bg: "bg-purple-50" },
  { icon: MessageSquareWarning, label: "Disease Detection", desc: "Upload a photo and get AI-powered diagnosis and treatment suggestions.", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: CloudSun, label: "Weather Updates", desc: "Real-time weather forecasts and alerts to help you plan better.", color: "text-cyan-500", bg: "bg-cyan-50" },
  { icon: Wallet, label: "Finance Tracking", desc: "Track expenses, income and profits to grow your agricultural business.", color: "text-amber-500", bg: "bg-amber-50" },
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
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/logo.png" alt="KilimoHub" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-6">
            {!loading && !isAuthenticated && (
              <>
                <button 
                  onClick={() => navigate("/login")} 
                  className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Login
                </button>
                <Button 
                  onClick={() => navigate("/register")} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 h-10 shadow-sm"
                >
                  Get Started
                </Button>
              </>
            )}
            {!loading && isAuthenticated && (
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 h-10 shadow-sm"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-50 min-h-[700px] lg:min-h-[800px] flex items-center">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000&auto=format&fit=crop" 
            alt="Tea Farm Background" 
            className="w-full h-full object-cover object-center"
          />
          {/* White gradient fading from top and left to blend the image perfectly */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white"></div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold mb-6 border border-emerald-100 shadow-sm">
                <Sprout className="w-3.5 h-3.5" />
                Empowering Farmers with Technology
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                Smart Farming <br/>
                for a <span className="text-emerald-600">Better Tomorrow</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                KilimoHub is an all-in-one agriculture platform that helps farmers manage their farms, increase productivity and connect to markets.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 text-base font-medium shadow-md shadow-emerald-600/20"
                  onClick={() => navigate("/register")}
                >
                  Get Started for Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full h-12 px-8 text-base font-medium border-gray-200 text-gray-700 hover:bg-gray-50 bg-white"
                >
                  <Play className="w-4 h-4 mr-2 text-emerald-600 fill-emerald-600" /> Watch Demo
                </Button>
              </div>

              {/* Avatars */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">J</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">M</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-sky-100 flex items-center justify-center text-[10px] font-bold text-sky-700">A</div>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Trusted by <span className="font-bold text-gray-900">5,000+ farmers</span> across Kenya and beyond
                </p>
              </div>
            </div>

            {/* Right Column: Floating Dashboard Cards */}
            <div className="relative w-full max-w-lg mx-auto lg:ml-auto">
              <div className="flex flex-col gap-4 drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                {/* Card 1 */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/50">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
                    <Sprout className="w-3.5 h-3.5 text-emerald-500" /> Farm Overview
                  </div>
                  <div className="flex items-end gap-3 mb-6">
                    <div className="text-sm text-gray-500 font-medium pb-1">Total Farms</div>
                    <div className="text-3xl font-bold text-gray-900 leading-none">3</div>
                    <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded pb-1">+12%</div>
                  </div>
                  <div className="flex items-end h-8 gap-1 w-full mt-2">
                    {[30, 40, 20, 50, 40, 60, 50, 70, 80].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-400 rounded-t-sm" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/50 ml-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" /> Total Revenue
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-sm text-gray-500 font-medium pb-1">KES</div>
                    <div className="text-3xl font-bold text-gray-900 leading-none">245,000</div>
                    <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded pb-1">+18.5%</div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">This Month</div>
                </div>

                {/* Card 3 */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/50 ml-8">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
                    <Leaf className="w-3.5 h-3.5 text-sky-500" /> Active Crops
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-3xl font-bold text-gray-900 leading-none">8</div>
                    <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded pb-1">+2</div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">This Season</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-sm font-bold tracking-widest text-emerald-600 uppercase mb-3">All-In-One Platform</h3>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Everything You Need to Grow <br className="hidden sm:block"/>
              <span className="text-emerald-600">Your Farm, Your Way</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-12 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex gap-5 group">
                <div className={`w-14 h-14 shrink-0 rounded-2xl ${f.bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{f.label}</h4>
                  <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats & CTA Section */}
      <section className="pb-24">
        {/* Stats Banner */}
        <div className="bg-[#0B2519] py-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-start lg:items-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">5,000+</div>
                <div className="text-xs font-bold tracking-widest text-emerald-400/80 uppercase">Happy Farmers</div>
              </div>
              <div className="flex flex-col items-start lg:items-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">20+</div>
                <div className="text-xs font-bold tracking-widest text-emerald-400/80 uppercase">Counties Covered</div>
              </div>
              <div className="flex flex-col items-start lg:items-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Sprout className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">50+</div>
                <div className="text-xs font-bold tracking-widest text-emerald-400/80 uppercase">Crops Supported</div>
              </div>
              <div className="flex flex-col items-start lg:items-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">100%</div>
                <div className="text-xs font-bold tracking-widest text-emerald-400/80 uppercase">Customer Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Box */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-[#2B8652] rounded-3xl overflow-hidden flex flex-col md:flex-row items-center justify-between relative shadow-xl">
            <div className="p-10 lg:p-16 z-10 max-w-xl">
              <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
                Join thousands of smart farmers already growing with KilimoHub
              </h2>
              <Button 
                size="lg" 
                className="bg-white hover:bg-gray-50 text-[#2B8652] rounded-full px-8 h-12 text-base font-semibold"
                onClick={() => navigate("/register")}
              >
                Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {/* CTA Graphic (Simulated UI snippet) */}
            <div className="hidden md:block absolute right-0 bottom-0 top-0 w-1/3 min-w-[300px]">
              <div className="absolute right-[-20%] bottom-[-10%] w-full h-[120%] bg-white rounded-l-3xl shadow-2xl p-6 border-y-8 border-l-8 border-gray-100 flex flex-col gap-4 transform rotate-[-2deg]">
                 <div className="w-24 h-4 bg-gray-200 rounded-full"></div>
                 <div className="w-full h-12 bg-emerald-50 rounded-xl"></div>
                 <div className="w-3/4 h-8 bg-gray-100 rounded-lg"></div>
                 <div className="w-full h-12 bg-gray-50 rounded-xl mt-4"></div>
                 <div className="w-full h-12 bg-gray-50 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A1016] pt-20 pb-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Branding Column */}
            <div className="lg:col-span-4">
              <div className="bg-white inline-block px-3 py-2 rounded-lg mb-6">
                <img src="/logo.png" alt="KilimoHub" className="h-6 object-contain" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">KilimoHub</h3>
              <p className="text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
                Helping African farmers manage farms, access markets and grow with confidence.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white transition-colors"><Facebook className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white transition-colors"><Linkedin className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white transition-colors"><Instagram className="w-4 h-4" /></a>
              </div>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-6">Platform</h4>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Dashboard</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Farm Management</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Marketplace</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">AI Assistant</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Disease Detection</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Weather Updates</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Finance & Reports</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-6">Company</h4>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Our Mission</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog & News</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Partners</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Press Kit</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-6">Support</h4>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Cookie Policy</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-6">Contact</h4>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li className="flex gap-3">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Nairobi, Kenya</span>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>support@kilimohub.co.ke</span>
                  </li>
                  <li className="flex gap-3">
                    <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Mon - Sat · 8:00am - 6:00pm EAT</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} KilimoHub Technologies Ltd.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
