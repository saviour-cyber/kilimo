import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, User as UserIcon, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync({ email });
      setSubmitted(true);
      toast.success("Password reset instructions sent!");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
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
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Forgot password?</h1>
          <p className="text-[14px] text-slate-500">
            {submitted 
              ? "Check your email for reset instructions." 
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/70 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] p-6 text-left">
          {submitted ? (
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center text-[#10B981]">
                <Mail className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-[14px] text-slate-600 mb-4">
                  We've sent an email to <strong>{email}</strong> with a link to reset your password.
                </p>
                <a href="/login" className="text-[#10B981] hover:text-[#059669] font-semibold text-[14px] transition-colors flex items-center justify-center gap-1">
                  Back to sign in
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending || !email}
                className="w-full h-[52px] bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[15px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              
              <div className="text-center text-[13.5px] text-slate-500 pt-2">
                Remember your password?{" "}
                <a href="/login" className="text-[#10B981] hover:text-[#059669] font-semibold transition-colors">
                  Sign in
                </a>
              </div>
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
          © {currentYear} KiliSense.
        </p>
      </div>
    </div>
  );
}

