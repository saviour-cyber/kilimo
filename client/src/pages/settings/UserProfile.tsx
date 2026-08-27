import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Camera, User } from "lucide-react";

const TIMEZONES = [
  "Africa/Nairobi", "Africa/Lagos", "Africa/Cairo", "Africa/Johannesburg",
  "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Pacific/Auckland", "UTC",
];

export default function UserProfile() {
  const { data: user, isLoading } = trpc.users.getProfile.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    preferredLanguage: "en",
    timezone: "Africa/Nairobi",
    theme: "system",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        phone: user.phone ?? "",
        preferredLanguage: user.preferredLanguage ?? "en",
        timezone: (user as any).timezone ?? "Africa/Nairobi",
        theme: user.theme ?? "system",
      });
    }
  }, [user]);

  const update = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.users.getProfile.invalidate();
      toast.success("Profile updated successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({ ...form, theme: form.theme as any });
  };

  if (isLoading) return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-border">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">My Profile</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Manage your personal information and preferences. These settings apply everywhere, across all organizations and farms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Section */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Profile Photo</h3>
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer shrink-0">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {user?.name?.[0]?.toUpperCase() || <User className="w-8 h-8 text-muted-foreground" />}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user?.name || "Set your name"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</p>
              <button type="button" className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium">Upload photo</button>
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section className="space-y-5">
          <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-3">Personal Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
              <Input value={user?.email ?? ""} disabled className="bg-muted text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+254 700 000 000"
            />
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-5">
          <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-3">Preferences</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Preferred Language</Label>
              <Select value={form.preferredLanguage} onValueChange={(v) => setForm({ ...form, preferredLanguage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="sw">Kiswahili</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Theme</Label>
              <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Time Zone</Label>
            <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Used to display dates and times across the platform.</p>
          </div>
        </section>

        {/* Save */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Changes apply across all your organizations and farms.</p>
          <Button type="submit" disabled={update.isPending} className="min-w-[120px]">
            {update.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
