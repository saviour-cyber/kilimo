import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const utils = trpc.useContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      const me = await utils.auth.me.ensureData();
      if (me?.role !== "admin") {
        toast.error("This portal is restricted to platform administrators.");
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
    <div className="min-h-screen bg-[#f7f8f9] flex flex-col items-center justify-center relative px-4 font-sans text-slate-800">
      
      {/* Header section (Logo + Title) */}
      <div className="flex flex-col items-center justify-center mb-8">
        <img 
          src="/logo.png" 
          alt="KilimoHub Logo" 
          className="object-contain mb-4" 
          style={{ height: '64px' }}
        />
        <h1 className="text-2xl font-bold text-[#1a202c]">Admin</h1>
      </div>

      {/* Card */}
      <div className="w-[90%] min-w-[320px] max-w-[400px] md:max-w-[480px] md:w-[440px] lg:max-w-[460px] bg-white rounded-[20px] border border-slate-200 shadow-[0_4px_24px_rgb(0,0,0,0.02)] p-[32px] md:p-[40px] lg:p-[48px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-[14px] text-slate-600 font-medium block">
              Username or Email Address
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="absolute left-[44px] top-1/2 -translate-y-1/2 w-px h-6 bg-slate-200" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-[52px] md:h-[56px] pl-[60px] pr-4 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[14px] text-slate-600 font-medium block">
              Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <div className="absolute left-[44px] top-1/2 -translate-y-1/2 w-px h-6 bg-slate-200" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-[52px] md:h-[56px] pl-[60px] pr-12 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(!!c)}
                className="border-slate-300 data-[state=checked]:bg-[#10B981] data-[state=checked]:border-[#10B981]"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none text-slate-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Remember Me
              </label>
            </div>
            <a href="#" className="text-sm text-[#10B981] hover:text-emerald-700 hover:underline">
              Lost your password?
            </a>
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending || !email || !password}
            className="w-full h-[52px] md:h-[56px] bg-[#0F9D58] hover:bg-[#0b8043] text-white font-semibold text-[16px] rounded-md transition-colors shadow-none mt-2"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Logging In...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-[13px] text-slate-500">
        © 2024 KilimoHub. All rights reserved.
      </div>

    </div>
  );
}
