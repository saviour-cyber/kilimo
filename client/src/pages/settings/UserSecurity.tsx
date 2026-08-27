import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, Smartphone, Monitor, History, Code2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const UserSecurity = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const changePassword = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    changePassword.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
  };

  return (
    <div className="max-w-2xl space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">Security</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Manage your password, active sessions, devices, API tokens, and login history.
        </p>
      </div>

      {/* Password */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Key className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="border border-border rounded-xl p-5 space-y-4 bg-muted/30">
          <div className="space-y-1.5 relative">
            <Label className="text-sm font-medium text-muted-foreground">Current Password</Label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="pr-10" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">New Password</Label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required className="pr-10" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Confirm New Password</Label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required className="pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
          <Button type="submit" disabled={changePassword.isPending} size="sm">
            {changePassword.isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </section>

    </div>
  );
}

export default UserSecurity;
