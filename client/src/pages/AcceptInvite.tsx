import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Sprout } from "lucide-react";

export default function AcceptInvite() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const { data: invite, isLoading: inviteLoading, error: inviteError } = trpc.invites.getInviteByToken.useQuery(
    { inviteToken: token },
    { enabled: !!token && !authLoading }
  );

  const accept = trpc.invites.acceptInvite.useMutation({
    onSuccess: (result) => {
      toast.success("Invitation accepted! Redirecting to farm...");
      setTimeout(() => navigate("/dashboard"), 1500);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAccept = () => {
    if (invite?.email !== user?.email) {
      toast.error("This invitation is for a different email address");
      return;
    }
    accept.mutate({ inviteToken: token });
  };

  if (authLoading || inviteLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteError || !invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Invalid Invitation</h1>
            <p className="text-sm text-muted-foreground">This invitation is invalid, expired, or has already been used.</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailMismatch = invite.email !== user?.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Sprout className="w-7 h-7 text-emerald-600" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Join Farm</h1>
            <p className="text-sm text-muted-foreground">You've been invited to join a farm on KiliSense</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Invitation Email</p>
              <p className="font-medium text-foreground mt-1">{invite.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Role</p>
              <p className="font-medium text-foreground capitalize mt-1">{invite.farmRole}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Expires</p>
              <p className="font-medium text-foreground mt-1">{new Date(invite.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>

          {emailMismatch && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                This invitation is for <strong>{invite.email}</strong>, but you're signed in as <strong>{user?.email}</strong>. Please sign out and sign in with the correct email.
              </p>
            </div>
          )}

          {!emailMismatch && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Email matches. Click below to accept and join the farm.</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/")} disabled={accept.isPending}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAccept}
              disabled={emailMismatch || accept.isPending}
            >
              {accept.isPending ? "Accepting..." : "Accept Invitation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
