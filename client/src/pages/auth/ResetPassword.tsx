import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Lock, EyeOff, Eye, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    // Extract token from URL search params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast.error("Invalid or missing reset token.");
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword: password });
      setSubmitted(true);
      toast.success("Password reset successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password.");
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
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="SproutX" className="w-9 h-9 rounded-xl object-contain" />
          <span className="text-[20px] font-bold text-slate-800 tracking-tight">
            SproutX<span className="text-[#10B981]">Hub</span>
          </span>
        </div>

        {/* Welcome heading */}
        <div className="space-y-1">
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Set new password</h1>
          <p className="text-[14px] text-slate-500">
            {submitted 
              ? "Your password has been successfully reset." 
              : "Choose a new password for your account."}
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/70 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] p-6 text-left">
          {submitted ? (
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center text-[#10B981]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-[14px] text-slate-600 mb-6 mt-2">
                  You can now sign in with your new password.
                </p>
                <Button
                  onClick={() => window.location.href = "/login"}
                  className="w-full h-[52px] bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[15px] rounded-xl transition-all shadow-sm flex items-center justify-center"
                >
                  Go to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[13px] text-slate-700 font-semibold block">
                  New Password
                </label>
                <div className="relative flex items-center group">
                  <div className="absolute left-3.5 text-slate-400 group-focus-within:text-[#10B981] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[13px] text-slate-700 font-semibold block">
                  Confirm Password
                </label>
                <div className="relative flex items-center group">
                  <div className="absolute left-3.5 text-slate-400 group-focus-within:text-[#10B981] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type it again"
                    required
                    className="w-full h-[50px] pl-10 pr-12 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all text-slate-900 text-[14px] placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending || !password || !confirmPassword || !token}
                className="w-full h-[52px] bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[15px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Trust Indicator */}
        <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Your data is safe with us</span>
        </div>

        {/* Footer */}
        <p className="text-[12px] text-slate-400 font-medium">
          © {currentYear} SproutX.
        </p>
      </div>
    </div>
  );
}
