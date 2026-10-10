import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Environment and Version
  const currentYear = new Date().getFullYear();
  const env = import.meta.env.MODE === "production" ? "Production" : "Development";
  const appVersion = "v1.0.0"; // In a real app this might come from package.json or env

  const loginMutation = trpc.auth.adminLogin.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return;

    try {
      await loginMutation.mutateAsync({ email: cleanEmail, password });
      await utils.auth.me.invalidate();
      await utils.auth.me.fetch();
      toast.success("Successfully logged in");
      setTimeout(() => {
        window.location.href = "/admin";
      }, 200);
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative px-4 font-sans text-foreground">
      
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full max-w-[400px] md:max-w-[440px] flex flex-col items-center">
        
        {/* Header section (Logo + Title) */}
        <div className="flex flex-col items-center justify-center mb-8 text-center space-y-4">
          <img 
            src="/logo.png" 
            alt="KiliSense Logo" 
            className="object-contain" 
            style={{ height: '140px' }}
          />
          <div className="space-y-1.5">
            <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Admin</h1>
            <p className="text-[14px] text-muted-foreground font-medium">Secure access to KiliSense.</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full bg-card rounded-2xl border border-border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-[28px] md:p-[44px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] text-muted-foreground font-medium block">
                Username or Email
              </label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kilisense.com"
                  required
                  className="w-full h-[52px] pl-11 pr-4 rounded-xl border border-border bg-muted/40 focus:bg-card focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground text-[14px] placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] text-muted-foreground font-medium block">
                Password
              </label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[52px] pl-11 pr-12 rounded-xl border border-border bg-muted/40 focus:bg-card focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground text-[14px] placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(!!c)}
                  className="border-border rounded-[4px] data-[state=checked]:bg-primary data-[state=checked]:border-primary w-4 h-4"
                />
                <label
                  htmlFor="remember"
                  className="text-[13px] font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                >
                  Remember Me
                </label>
              </div>
              <a href="#" className="text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors">
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full h-[52px] bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[15px] rounded-xl transition-all shadow-none mt-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-1 text-[12px] text-muted-foreground font-medium tracking-wide">
          <p>Â© {currentYear} KiliSense.</p>
          <p>{appVersion} â€¢ {env}</p>
        </div>

      </div>
    </div>
  );
}

