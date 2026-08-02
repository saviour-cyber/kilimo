import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShieldAlert, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const utils = trpc.useContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      const me = await utils.auth.me.ensureData();
      if (me?.role !== "admin") {
        toast.error("This portal is restricted to platform administrators.");
        // logout is a mutation — invalidate the me cache to force re-auth
        await utils.auth.me.invalidate();
        return;
      }
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
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(to right, var(--primary) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
            <ShieldAlert className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Email
              </label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-2 transition-all duration-200"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
