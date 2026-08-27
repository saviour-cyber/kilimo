import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/shared/AuthCard";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const verifyMutation = trpc.auth.verifyEmail.useMutation();
  const hasAttempted = useRef(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in the link.");
      return;
    }

    if (!hasAttempted.current) {
      hasAttempted.current = true;
      verifyMutation.mutate({ token }, {
        onSuccess: () => {
          setStatus("success");
          toast.success("Email verified successfully!");
        },
        onError: (err) => {
          setStatus("error");
          setErrorMessage(err.message || "Failed to verify email. The link may have expired.");
        }
      });
    }
  }, []);

  return (
    <AuthCard
      title={
        status === "loading" ? "Verifying email..." : 
        status === "success" ? "Email Verified!" : 
        "Verification Failed"
      }
      description={
        status === "loading" ? "Please wait while we confirm your email address." :
        status === "success" ? "Your email has been verified and your account is active." :
        "We could not verify your email address."
      }
    >
      <div className="flex flex-col items-center justify-center space-y-6 pt-2 pb-2">
        {status === "loading" && (
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        {status === "success" && (
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        )}
        {status === "error" && (
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
            <XCircle className="w-8 h-8" />
          </div>
        )}
        
        {status === "error" && errorMessage && (
          <p className="text-sm text-destructive font-medium text-center">{errorMessage}</p>
        )}
        
        <div className="w-full pt-4">
          {status === "success" && (
            <Button onClick={() => window.location.href = "/dashboard"} className="w-full h-11 text-base">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {status === "error" && (
            <Button onClick={() => setLocation("/login")} variant="outline" className="w-full h-11">
              Return to Login
            </Button>
          )}
          {status === "loading" && (
            <Button disabled variant="outline" className="w-full h-11">
              Please wait...
            </Button>
          )}
        </div>
      </div>
    </AuthCard>
  );
}