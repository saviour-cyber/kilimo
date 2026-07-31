import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sprout, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Unified State
  const [formData, setFormData] = useState({
    // Step 1: Account
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountCountry: "Kenya",
    acceptTerms: false,

    // Step 2: Organization
    orgName: "",
    businessType: "",
    orgCountry: "Kenya",
    county: "",
    currency: "KES",
    timezone: "Africa/Nairobi",

    // Step 3: Farm
    farmName: "",
    farmDescription: "",
    farmSize: "",
    farmUnit: "Acres",

    // Step 4: Modules
    moduleSelection: "", // 'crop', 'livestock', or 'both'
  });

  const registerMutation = trpc.auth.register.useMutation();
  const setupMutation = trpc.onboarding.setup.useMutation();

  const updateForm = (key: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Validations
  const isStep1Valid =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    formData.email.includes("@") &&
    formData.phone.trim().length > 0 &&
    formData.password.length > 0 &&
    formData.password === formData.confirmPassword &&
    formData.acceptTerms === true;

  const isStep2Valid =
    formData.orgName.trim().length > 0 &&
    formData.businessType.length > 0 &&
    formData.orgCountry.length > 0 &&
    formData.currency.length > 0 &&
    formData.timezone.length > 0;

  const isStep3Valid =
    formData.farmName.trim().length > 0 &&
    formData.farmSize.length > 0 &&
    !isNaN(Number(formData.farmSize)) &&
    formData.farmUnit.length > 0;

  const isStep4Valid = formData.moduleSelection.length > 0;

  const canProceed = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    if (step === 4) return isStep4Valid;
    return true;
  };

  const handleSubmit = async () => {
    try {
      // 1. Create User
      const userRes = await registerMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        country: formData.accountCountry,
      });

      // 2. Setup Tenant, Farm, Modules
      let modules: string[] = ["dashboard", "inventory", "equipment", "finance", "tasks", "notifications", "settings"];
      if (formData.moduleSelection === "crop" || formData.moduleSelection === "both") modules.push("crop");
      if (formData.moduleSelection === "livestock" || formData.moduleSelection === "both") modules.push("livestock");

      await setupMutation.mutateAsync({
        userId: userRes.userId,
        orgName: formData.orgName,
        businessType: formData.businessType,
        country: formData.orgCountry,
        county: formData.county,
        currency: formData.currency,
        timezone: formData.timezone,
        farmName: formData.farmName,
        farmSize: Number(formData.farmSize),
        unit: formData.farmUnit,
        modules,
      });

      toast.success("Setup complete! Welcome to KilimoHub.");
      // 3. Redirect to dashboard
      // Add a small delay so the cookie is registered properly before fetching /dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to complete setup.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl text-foreground tracking-tight">KilimoHub</span>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% Completed</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 ease-in-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && "Create your KilimoHub Account"}
              {step === 2 && "Create Your Organization"}
              {step === 3 && "Create Your First Farm"}
              {step === 4 && "Choose Farm Modules"}
              {step === 5 && "Review Setup"}
            </CardTitle>
            <CardDescription className="text-base">
              {step === 1 && "Create your personal account to access and manage your farms. You can create multiple farms later from your dashboard."}
              {step === 2 && "Your organization represents your farming business or cooperative. You can invite team members later."}
              {step === 3 && "Give your farm a name and basic information. You can create additional farms later."}
              {step === 4 && "Select the farming activities you want to manage. You can enable additional modules later."}
              {step === 5 && "Review your information before completing the setup."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* STEP 1 */}
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

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" value={formData.orgName} onChange={(e) => updateForm("orgName", e.target.value)} placeholder="e.g., Karume Farms Ltd" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select value={formData.businessType} onValueChange={(v) => updateForm("businessType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select Business Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual Farmer">Individual Farmer</SelectItem>
                      <SelectItem value="Farm Business">Farm Business</SelectItem>
                      <SelectItem value="Agricultural Company">Agricultural Company</SelectItem>
                      <SelectItem value="Cooperative Society">Cooperative Society</SelectItem>
                      <SelectItem value="NGO">NGO</SelectItem>
                      <SelectItem value="Government Agency">Government Agency</SelectItem>
                      <SelectItem value="Research Institution">Research Institution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgCountry">Country</Label>
                    <Select value={formData.orgCountry} onValueChange={(v) => updateForm("orgCountry", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kenya">Kenya</SelectItem>
                        <SelectItem value="Uganda">Uganda</SelectItem>
                        <SelectItem value="Tanzania">Tanzania</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County / State</Label>
                    <Input id="county" value={formData.county} onChange={(e) => updateForm("county", e.target.value)} placeholder="e.g., Kiambu" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Preferred Currency</Label>
                    <Select value={formData.currency} onValueChange={(v) => updateForm("currency", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="UGX">UGX</SelectItem>
                        <SelectItem value="TZS">TZS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={(v) => updateForm("timezone", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                        <SelectItem value="Africa/Kampala">Africa/Kampala</SelectItem>
                        <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="farmName">Farm Name</Label>
                  <Input id="farmName" value={formData.farmName} onChange={(e) => updateForm("farmName", e.target.value)} placeholder="e.g., Green Valley" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farmDescription">Farm Description (Optional)</Label>
                  <Textarea id="farmDescription" value={formData.farmDescription} onChange={(e) => updateForm("farmDescription", e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmSize">Farm Size</Label>
                    <Input id="farmSize" type="number" value={formData.farmSize} onChange={(e) => updateForm("farmSize", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farmUnit">Unit</Label>
                    <Select value={formData.farmUnit} onValueChange={(v) => updateForm("farmUnit", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Acres">Acres</SelectItem>
                        <SelectItem value="Hectares">Hectares</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <RadioGroup value={formData.moduleSelection} onValueChange={(v) => updateForm("moduleSelection", v)} className="space-y-3">
                <div className={`flex items-start space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${formData.moduleSelection === 'crop' ? 'border-emerald-500 bg-emerald-50/50' : 'hover:bg-slate-50'}`} onClick={() => updateForm("moduleSelection", "crop")}>
                  <RadioGroupItem value="crop" id="crop" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="crop" className="text-base font-semibold block cursor-pointer">Crop Management</Label>
                    <p className="text-sm text-muted-foreground mt-1">Manage planting, harvesting, diseases and crop production.</p>
                  </div>
                </div>

                <div className={`flex items-start space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${formData.moduleSelection === 'livestock' ? 'border-amber-500 bg-amber-50/50' : 'hover:bg-slate-50'}`} onClick={() => updateForm("moduleSelection", "livestock")}>
                  <RadioGroupItem value="livestock" id="livestock" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="livestock" className="text-base font-semibold block cursor-pointer">Livestock Management</Label>
                    <p className="text-sm text-muted-foreground mt-1">Manage animals, breeding, health and production.</p>
                  </div>
                </div>

                <div className={`flex items-start space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${formData.moduleSelection === 'both' ? 'border-blue-500 bg-blue-50/50' : 'hover:bg-slate-50'}`} onClick={() => updateForm("moduleSelection", "both")}>
                  <RadioGroupItem value="both" id="both" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="both" className="text-base font-semibold block cursor-pointer">Crop + Livestock</Label>
                    <p className="text-sm text-muted-foreground mt-1">Enable both modules for a mixed farming operation.</p>
                  </div>
                </div>
              </RadioGroup>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-5 rounded-xl border space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="text-sm text-muted-foreground">Account</div>
                    <div className="font-medium flex items-center gap-2">{formData.firstName} {formData.lastName} <CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="text-sm text-muted-foreground">Organization</div>
                    <div className="font-medium flex items-center gap-2">{formData.orgName} <CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="text-sm text-muted-foreground">Farm</div>
                    <div className="font-medium flex items-center gap-2">{formData.farmName} <CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Modules to Enable:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(formData.moduleSelection === "crop" || formData.moduleSelection === "both") && (
                        <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Crop Management</div>
                      )}
                      {(formData.moduleSelection === "livestock" || formData.moduleSelection === "both") && (
                        <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Livestock Management</div>
                      )}
                      <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Inventory</div>
                      <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Equipment</div>
                      <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Finance</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1 || registerMutation.isPending || setupMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < totalSteps ? (
              <Button onClick={nextStep} disabled={!canProceed()} className="bg-emerald-600 hover:bg-emerald-700">
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={registerMutation.isPending || setupMutation.isPending} 
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {registerMutation.isPending || setupMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <>Finish Setup <CheckCircle2 className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account? <a href="/login" className="text-emerald-600 hover:underline font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
