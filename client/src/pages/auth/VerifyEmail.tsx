import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Sprout, ArrowRight } from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 mb-4">
          <img src="/logo.png" alt="SproutX" className="w-24 h-24 object-contain" />
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="text-center">
            {status === "loading" && (
              <CardTitle className="text-2xl flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                Verifying your email...
              </CardTitle>
            )}
            {status === "success" && (
              <CardTitle className="text-2xl flex flex-col items-center gap-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                Email Verified!
              </CardTitle>
            )}
            {status === "error" && (
              <CardTitle className="text-2xl flex flex-col items-center gap-4">
                <XCircle className="w-12 h-12 text-destructive" />
                Verification Failed
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="text-center">
            {status === "loading" && (
              <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
            )}
            {status === "success" && (
              <p className="text-muted-foreground">Your email has been verified and your account is now fully active. You have been logged in automatically.</p>
            )}
            {status === "error" && (
              <p className="text-destructive font-medium">{errorMessage}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t p-6">
            {status === "success" && (
              <Button onClick={() => window.location.href = "/dashboard"} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {status === "error" && (
              <Button onClick={() => setLocation("/login")} variant="outline" className="w-full">
                Return to Login
              </Button>
            )}
            {status === "loading" && (
              <Button disabled variant="outline" className="w-full">
                Please wait...
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
