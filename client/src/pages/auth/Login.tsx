import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sprout, Loader2, Eye, EyeOff, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolvePostLoginPath } from "@/components/AuthRouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const utils = trpc.useUtils();

  const currentYear = new Date().getFullYear();

  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      await loginMutation.mutateAsync({ email, password });
      await utils.auth.me.invalidate();
      const me = await utils.auth.me.fetch();
      toast.success("Successfully logged in");
      setTimeout(() => {
        window.location.href = resolvePostLoginPath(me?.role);
      }, 300);
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    }
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
        
        {/* Header section */}
        <div className="flex flex-col items-center justify-center mb-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#10B981] flex items-center justify-center shadow-sm shadow-[#10B981]/20">
            <Sprout className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-[14px] text-slate-500 font-medium">Sign in to manage your farms.</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-[28px] md:p-[44px]">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] text-slate-700 font-medium block">
                Email Address
              </label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-[#10B981] transition-colors">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full h-[52px] pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all text-slate-900 text-[14px] placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] text-slate-700 font-medium block">
                  Password
                </label>
                <a href="#" className="text-[13px] font-medium text-slate-500 hover:text-[#10B981] transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-[#10B981] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[52px] pl-11 pr-12 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all text-slate-900 text-[14px] placeholder:text-slate-400"
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

            <Button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full h-[52px] bg-[#10B981] hover:bg-[#059669] text-white font-medium text-[15px] rounded-xl transition-all shadow-none mt-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            
            <div className="text-center text-[13.5px] text-slate-500 pt-2">
              Don't have an account?{" "}
              <a href="/register" className="text-[#10B981] hover:underline font-medium">
                Create one
              </a>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-1 text-[12px] text-slate-400 font-medium tracking-wide">
          <p>© {currentYear} KilimoHub.</p>
        </div>

      </div>
    </div>
  );
}
