import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Leaf } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CreateFarm() {
  const [, navigate] = useLocation();
  const { refetchFarms, switchFarm } = useFarm();
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    farmType: "mixed" as const,
    sizeHectares: "",
    currency: "USD",
    timezone: "UTC",
  });

  const createFarm = trpc.farms.create.useMutation({
    onSuccess: async (data) => {
      await refetchFarms();
      switchFarm(data.farmId);
      toast.success("Farm created successfully!");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createFarm.mutate(form);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create a New Farm</h1>
          <p className="text-muted-foreground text-sm mt-1">Set up your farm profile to start managing operations</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Farm Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Green Valley Farm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your farm..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Farm Type</Label>
                  <Select value={form.farmType} onValueChange={(v) => setForm({ ...form, farmType: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="crop">Crop</SelectItem>
                      <SelectItem value="livestock">Livestock</SelectItem>
                      <SelectItem value="poultry">Poultry</SelectItem>
                      <SelectItem value="aquaculture">Aquaculture</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="size">Size (hectares)</Label>
                  <Input
                    id="size"
                    type="number"
                    placeholder="0.00"
                    value={form.sizeHectares}
                    onChange={(e) => setForm({ ...form, sizeHectares: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Nairobi, Kenya"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="KES">KES (KSh)</SelectItem>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="GHS">GHS (₵)</SelectItem>
                      <SelectItem value="ZAR">ZAR (R)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                      <SelectItem value="Africa/Accra">Africa/Accra</SelectItem>
                      <SelectItem value="Africa/Johannesburg">Africa/Johannesburg</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={createFarm.isPending || !form.name.trim()}>
                {createFarm.isPending ? "Creating..." : "Create Farm"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
