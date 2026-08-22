import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sprout, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export default function Register() {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountCountry: "Kenya",
    acceptTerms: false,
  });

  const registerMutation = trpc.auth.register.useMutation();

  const updateForm = (key: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    formData.email.includes("@") &&
    formData.phone.trim().length > 0 &&
    formData.password.length > 0 &&
    formData.password === formData.confirmPassword &&
    formData.acceptTerms === true;

  const handleSubmit = async () => {
    try {
      await registerMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        country: formData.accountCountry,
      });

      toast.success("Account created successfully!");
      setStep(2); // Go to "Check your email" step
      
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center gap-4 mb-4">
          <img src="/logo.png" alt="KiliSense" className="w-40 h-40 object-contain drop-shadow-md" />
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 ? "Create your KiliSense Account" : "Verify Your Email"}
            </CardTitle>
            <CardDescription className="text-base">
              {step === 1 
                ? "Create your personal account. You'll set up your farm and organization after logging in."
                : "One last step to secure your account."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={(e) => updateForm("firstName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={(e) => updateForm("lastName", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => updateForm("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={(e) => updateForm("phone", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={(e) => updateForm("password", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => updateForm("confirmPassword", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.accountCountry} onValueChange={(v) => updateForm("accountCountry", v)}>
                    <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="Uganda">Uganda</SelectItem>
                      <SelectItem value="Tanzania">Tanzania</SelectItem>
                      <SelectItem value="Rwanda">Rwanda</SelectItem>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="terms" checked={formData.acceptTerms} onCheckedChange={(checked) => updateForm("acceptTerms", checked === true)} />
                  <Label htmlFor="terms" className="text-sm font-normal">I accept the Terms of Service and Privacy Policy</Label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold">Check your email</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We've sent a verification link to <span className="font-semibold text-foreground">{formData.email}</span>. 
                  Please click the link in that email to verify your account and access KiliSense.
                </p>
                <div className="pt-6">
                  <Button variant="outline" onClick={() => window.location.href = "/login"}>
                    Return to Login
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          {step === 1 && (
            <CardFooter className="flex justify-end pt-6 border-t">
              <Button 
                onClick={handleSubmit} 
                disabled={!isFormValid || registerMutation.isPending} 
                className="bg-emerald-600 hover:bg-emerald-700 w-full"
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
        
        {step === 1 && (
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account? <a href="/login" className="text-emerald-600 hover:underline font-medium">Sign in</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

