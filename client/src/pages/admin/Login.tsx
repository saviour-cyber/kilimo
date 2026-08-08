import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminLogin() {
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Environment and Version
  const currentYear = new Date().getFullYear();
  const env = import.meta.env.MODE === "production" ? "Production" : "Development";
  const appVersion = "v1.0.0"; // In a real app this might come from package.json or env

  const loginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: async () => {
      navigate("/admin");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center relative px-4 font-sans text-slate-800">
      
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full max-w-[400px] md:max-w-[440px] flex flex-col items-center">
        
        {/* Header section (Logo + Title) */}
        <div className="flex flex-col items-center justify-center mb-8 text-center space-y-4">
          <img 
            src="/logo.png" 
            alt="KilimoHub Logo" 
            className="object-contain" 
            style={{ height: '76px' }}
          />
          <div className="space-y-1.5">
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Platform Admin</h1>
            <p className="text-[14px] text-slate-500 font-medium">Secure access to the KilimoHub Platform.</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-[28px] md:p-[44px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] text-slate-700 font-medium block">
                Username or Email
              </label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kilimohub.com"
                  required
                  className="w-full h-[52px] pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-900 text-[14px] placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] text-slate-700 font-medium block">
                Password
              </label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[52px] pl-11 pr-12 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-900 text-[14px] placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(!!c)}
                  className="border-slate-300 rounded-[4px] data-[state=checked]:bg-[#10B981] data-[state=checked]:border-[#10B981] w-4 h-4"
                />
                <label
                  htmlFor="remember"
                  className="text-[13px] font-medium leading-none text-slate-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                >
                  Remember Me
                </label>
              </div>
              <a href="#" className="text-[13px] font-medium text-slate-500 hover:text-emerald-600 transition-colors">
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full h-[52px] bg-[#10B981] hover:bg-[#059669] text-white font-medium text-[15px] rounded-xl transition-all shadow-none mt-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-1 text-[12px] text-slate-400 font-medium tracking-wide">
          <p>© {currentYear} KilimoHub.</p>
          <p>{appVersion} • {env}</p>
        </div>

      </div>
    </div>
  );
}
