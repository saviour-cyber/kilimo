import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Lock, User as UserIcon, Mail, Building, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/shared/AuthCard";
import { resolvePostLoginPath } from "@/components/AuthRouter";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      toast.error("Please agree to the Terms of Service.");
      return;
    }

    try {
      await registerMutation.mutateAsync({ 
        email, 
        password, 
        firstName,
        lastName,
        organizationName: organizationName || undefined
      });
      await utils.auth.me.invalidate();
      const me = await utils.auth.me.fetch();
      toast.success("Registration successful!");
      setTimeout(() => {
        window.location.href = resolvePostLoginPath(me?.role);
      }, 300);
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    }
  };

  return (
    <AuthCard
      title="Create an account"
      description="Join KiliSense to manage your farm efficiently."
      footer={
        <div className="flex flex-col items-center gap-4 mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:text-primary/90 font-medium transition-colors">
              Sign in
            </a>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure, encrypted connection</span>
          </div>
        </div>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">First Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Last Name</label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">Organization (Optional)</label>
          <div className="relative">
            <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="org"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Farm Name Ltd"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              minLength={6}
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

        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            required
          />
          <label htmlFor="agreeTerms" className="text-xs font-medium leading-none text-muted-foreground">
            I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </label>
        </div>

        <Button
          type="submit"
          disabled={registerMutation.isPending || !email || !password || !name || !agreeTerms}
          className="w-full h-11 text-base font-medium mt-2"
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <div className="relative pt-2">
          <div className="absolute inset-0 flex items-center pt-2">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase pt-2">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => toast.info("Google sign-in coming soon")}
          className="w-full h-11"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </Button>
      </form>
    </AuthCard>
  );
}