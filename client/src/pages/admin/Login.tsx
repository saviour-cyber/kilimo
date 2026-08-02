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
    <div className="min-h-screen bg-[#060C16] flex items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(to right, #4ade80 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Header Badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white/80 text-sm font-medium tracking-wide">Platform Admin Portal</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#0F1A2B]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Superadmin Access</h1>
            <p className="text-slate-400 text-sm">Restricted to authorized platform administrators only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Admin Email
              </label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@kilimohub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
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
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm mt-2 transition-all duration-200 shadow-lg shadow-emerald-500/20"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In to Admin Panel
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-600 text-xs">
              Not an administrator?{" "}
              <a href="/login" className="text-slate-400 hover:text-emerald-400 transition-colors">
                Return to farm login →
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-6">
          KilimoHub Platform Admin — All access attempts are logged.
        </p>
      </div>
    </div>
  );
}
