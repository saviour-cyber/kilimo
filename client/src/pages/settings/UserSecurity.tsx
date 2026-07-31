import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, Smartphone, Monitor, History, Code2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SESSIONS = [
  { device: "Chrome on Windows", location: "Nairobi, Kenya", current: true, lastActive: "Now" },
  { device: "Safari on iPhone", location: "Nairobi, Kenya", current: false, lastActive: "2 hours ago" },
];

const LOGIN_HISTORY = [
  { date: "Jul 30, 2026 10:12 AM", device: "Chrome on Windows", location: "Nairobi, Kenya", status: "success" },
  { date: "Jul 28, 2026 08:44 AM", device: "Safari on iPhone", location: "Nairobi, Kenya", status: "success" },
  { date: "Jul 25, 2026 06:30 PM", device: "Unknown device", location: "Unknown location", status: "failed" },
];

export default function UserSecurity() {
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
      <div className="pb-6 border-b border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Security</h2>
        <p className="text-sm text-slate-500 mt-1.5">
          Manage your password, active sessions, devices, API tokens, and login history.
        </p>
      </div>

      {/* Password */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Key className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/30">
          <div className="space-y-1.5 relative">
            <Label className="text-sm font-medium text-slate-700">Current Password</Label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="pr-10" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">New Password</Label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required className="pr-10" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Confirm New Password</Label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required className="pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Must be at least 8 characters.</p>
          <Button type="submit" disabled={changePassword.isPending} size="sm">
            {changePassword.isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </section>

      {/* 2FA */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Two-Factor Authentication</h3>
        </div>
        <div className="border border-slate-200 rounded-xl p-5 flex items-center justify-between bg-slate-50/30">
          <div>
            <p className="text-sm font-medium text-slate-900">Authenticator App</p>
            <p className="text-sm text-slate-500 mt-0.5">Add an extra layer of security using an authenticator app.</p>
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-2 inline-block">Coming Soon</span>
          </div>
          <Button variant="outline" disabled size="sm">Enable 2FA</Button>
        </div>
      </section>

      {/* Sessions */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Active Sessions</h3>
        </div>
        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {SESSIONS.map((s, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{s.device}</p>
                  <p className="text-xs text-slate-500">{s.location} · {s.lastActive}</p>
                </div>
              </div>
              {s.current
                ? <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Current</span>
                : <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-7">Revoke</Button>
              }
            </div>
          ))}
        </div>
      </section>


      {/* Login History */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <History className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Login History</h3>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Device</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LOGIN_HISTORY.map((h, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-600 text-xs">{h.date}</td>
                  <td className="px-4 py-3 text-slate-700 text-xs font-medium">{h.device}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{h.location}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border",
                      h.status === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-600 bg-red-50 border-red-200")}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
