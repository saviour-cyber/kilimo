import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sprout, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      await loginMutation.mutateAsync({ email, password });
      toast.success("Successfully logged in");
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl text-foreground tracking-tight">KilimoHub</span>
        </div>

        <Card className="shadow-lg border-slate-200">
          <form onSubmit={handleLogin}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to manage your farms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm font-medium text-emerald-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
                ) : (
                  "Sign in"
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground w-full">
                Don't have an account?{" "}
                <a href="/register" className="text-emerald-600 hover:underline font-medium">
                  Create one
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
