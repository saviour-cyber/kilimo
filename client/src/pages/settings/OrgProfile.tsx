import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useFarm } from "@/contexts/FarmContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Building2, Camera, Mail, Phone, MapPin, FileText } from "lucide-react";

export default function OrgProfile() {
  const { currentFarm } = useFarm();
  const organizationId = currentFarm?.farm.organizationId ?? 0;

  const { data: org, isLoading } = trpc.organizations.get.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    name: "", description: "", country: "Kenya",
    county: "", address: "", taxId: "", contactEmail: "", contactPhone: "",
  });

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name ?? "",
        description: org.description ?? "",
        country: org.country ?? "Kenya",
        county: org.county ?? "",
        address: org.address ?? "",
        taxId: org.taxId ?? "",
        contactEmail: org.contactEmail ?? "",
        contactPhone: org.contactPhone ?? "",
      });
    }
  }, [org]);

  const update = trpc.organizations.update.useMutation({
    onSuccess: () => { utils.organizations.get.invalidate(); toast.success("Organization profile updated"); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="max-w-2xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /></div>;
  if (!organizationId) return <div className="p-4 text-slate-500">No active organization found.</div>;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Organization Profile</h2>
        <p className="text-sm text-slate-500 mt-1.5">
          Details for your entire organization. These settings apply to all farms within it.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); update.mutate({ organizationId, ...form }); }} className="space-y-8">
        {/* Logo */}
        <section>
          <h3 className="text-sm font-medium text-slate-700 mb-4">Organization Logo</h3>
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer shrink-0">
              <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                {org?.logoUrl
                  ? <img src={org.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  : <Building2 className="w-8 h-8 text-slate-400" />}
              </div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{org?.name}</p>
              <p className="text-sm text-slate-500 capitalize">{org?.businessType?.replace(/_/g, " ")} Organization</p>
              <button type="button" className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium">Upload logo</button>
            </div>
          </div>
        </section>

        {/* Identity */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 border-b border-slate-100 pb-3">Organization Details</h3>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Organization Name <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Green Valley Enterprises" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              placeholder="Briefly describe your organization and its farming operations..." />
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Contact Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Contact Email</Label>
              <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="contact@yourorg.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Contact Phone</Label>
              <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+254 700 000 000" />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 border-b border-slate-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Location
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Kenya" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">County / State</Label>
              <Input value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="Nairobi" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Physical Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Farm Road, Nairobi" />
          </div>
        </section>

        {/* Legal */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Legal & Tax
          </h3>
          <div className="space-y-1.5 max-w-xs">
            <Label className="text-sm font-medium text-slate-700">Tax / PIN Number <span className="text-xs text-slate-400 font-normal">(Optional)</span></Label>
            <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="e.g. P000000000Z" />
          </div>
        </section>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-400">Only the organization owner can save changes.</p>
          <Button type="submit" disabled={update.isPending} className="min-w-[120px]">
            {update.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
