import { useEffect, useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function FarmProfile() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    size: "",
    sizeUnit: "acres",
    currency: "USD",
    timezone: "Africa/Nairobi",
  });

  useEffect(() => {
    if (currentFarm?.farm) {
      const f = currentFarm.farm as any;
      setForm({
        name: f.name ?? "",
        description: f.description ?? "",
        location: f.location ?? "",
        size: f.sizeHectares ? String(f.sizeHectares) : "",
        sizeUnit: "hectares",
        currency: f.currency ?? "USD",
        timezone: f.timezone ?? "Africa/Nairobi",
      });
    }
  }, [currentFarm]);

  const update = trpc.farms.update.useMutation({
    onSuccess: () => { 
      utils.farms.list.invalidate(); 
      utils.farms.get.invalidate(); 
      toast.success("Farm profile updated"); 
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({ 
      farmId, 
      name: form.name, 
      description: form.description, 
      location: form.location, 
      currency: form.currency, 
      timezone: form.timezone, 
      sizeHectares: form.size || undefined 
    });
  };

  if (!currentFarm) return <Skeleton className="h-64 max-w-2xl" />;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 pb-6 border-b">
        <h2 className="text-2xl font-bold text-foreground">Farm Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage details specific to the currently selected farm.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <Label>Farm Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="County, Region" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Farm Size</Label>
            <Input type="number" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Size Unit</Label>
            <Select value={form.sizeUnit} onValueChange={(v) => setForm({ ...form, sizeUnit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["acres", "hectares", "sq_meters", "sq_feet"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["USD", "KES", "UGX", "TZS", "ZAR", "NGN", "GHS", "EUR", "GBP"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Africa/Nairobi", "Africa/Lagos", "Africa/Johannesburg", "Africa/Cairo", "UTC"].map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {can("manage") && (
          <div className="pt-4 border-t flex justify-end">
            <Button type="submit" disabled={update.isPending}>Save Changes</Button>
          </div>
        )}
      </form>
    </div>
  );
}
