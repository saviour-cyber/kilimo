import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/shared/AuthCard";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
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

  if (submitted) {
    return (
      <AuthCard
        title="Check your email"
        description="We've sent password reset instructions to your email."
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
            <Mail className="w-8 h-8" />
          </div>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              We've sent an email to <strong className="text-foreground">{email}</strong> with a link to reset your password.
            </p>
            <a href="/login" className="text-primary hover:text-primary/90 font-medium text-sm transition-colors flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </a>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send you a reset link."
      footer={
        <div className="flex flex-col items-center gap-4 mt-6">
          <a href="/login" className="text-sm text-primary hover:text-primary/90 font-medium transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </a>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure, encrypted connection</span>
          </div>
        </div>
      }
    >
      <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">
            Email Address
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="pl-9"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={forgotPasswordMutation.isPending || !email}
          className="w-full h-11 text-base font-medium mt-2"
        >
          {forgotPasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}