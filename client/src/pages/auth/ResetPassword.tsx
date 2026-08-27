import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Lock, EyeOff, Eye, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/shared/AuthCard";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
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

  if (submitted) {
    return (
      <AuthCard
        title="Password reset complete"
        description="Your password has been successfully reset."
        footer={
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure, encrypted connection</span>
            </div>
          </div>
        }
      >
        <div className="space-y-6 flex flex-col items-center pt-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              You can now sign in with your new password.
            </p>
            <Button asChild className="w-full">
              <a href="/login">
                Sign in to your account
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      description="Choose a new password for your account."
      footer={
        <div className="flex flex-col items-center gap-4 mt-6">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure, encrypted connection</span>
          </div>
        </div>
      }
    >
      <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={8}
              className="pl-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={8}
              className="pl-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={resetPasswordMutation.isPending || !password || !confirmPassword || !token}
          className="w-full h-11 text-base font-medium mt-2"
        >
          {resetPasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              Reset password
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  );
}