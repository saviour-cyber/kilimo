import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Lock, User as UserIcon, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolvePostLoginPath } from "@/components/AuthRouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 font-sans text-slate-800 relative overflow-hidden bg-[#F9FAFB]">

      {/* Soft green gradient background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(16,185,129,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full max-w-[390px] flex flex-col items-center space-y-5 text-center">

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-4 mb-4">
          <img src="/logo.png" alt="KiliSense" className="w-40 h-40 object-contain drop-shadow-md" />
        </div>

        {/* Welcome heading */}
        <div className="space-y-1">
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-[14px] text-slate-500">Sign in to continue to KiliSense.</p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/70 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] p-6 text-left">
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-slate-700 font-semibold block">
                Email Address
              </label>
              <div className="relative flex items-center group">
                <div className="absolute left-3.5 text-slate-400 group-focus-within:text-[#10B981] transition-colors">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full h-[50px] pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all text-slate-900 text-[14px] placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] text-slate-700 font-semibold block">
                  Password
                </label>
                <a href="/forgot-password" className="text-[13px] font-semibold text-[#10B981] hover:text-[#059669] transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative flex items-center group">
                <div className="absolute left-3.5 text-slate-400 group-focus-within:text-[#10B981] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full h-[50px] pl-10 pr-12 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all text-slate-900 text-[14px] placeholder:text-slate-400"
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

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  rememberMe
                    ? "bg-[#10B981] border-[#10B981]"
                    : "border-slate-300 bg-white group-hover:border-[#10B981]/60"
                }`}
              >
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[13.5px] text-slate-600 font-medium">Remember me</span>
            </label>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full h-[52px] bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[15px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[12px] text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => toast.info("Google sign-in coming soon")}
              className="w-full h-[50px] border border-slate-200 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center gap-3 text-[14px] font-semibold text-slate-700 transition-all shadow-none"
            >
              {/* Google "G" Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Create account */}
            <div className="text-center text-[13.5px] text-slate-500">
              Don't have an account?{" "}
              <a href="/register" className="text-[#10B981] hover:text-[#059669] font-semibold transition-colors">
                Create one
              </a>
            </div>
          </form>
        </div>

        {/* Trust Indicator */}
        <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Your data is safe with us</span>
        </div>

        {/* Footer */}
        <p className="text-[12px] text-slate-400 font-medium">
          © {currentYear} KiliSense.
        </p>

      </div>
    </div>
  );
}

