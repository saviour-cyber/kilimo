import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useFarm } from "@/contexts/FarmContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, UserPlus, MoreHorizontal, Pencil, UserX, ArrowRightLeft, Trash2, ShieldCheck, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_META: Record<string, { label: string; color: string }> = {
  owner:              { label: "Owner",              color: "bg-violet-50 text-violet-700 border-violet-200" },
  admin:              { label: "Administrator",       color: "bg-blue-50 text-blue-700 border-blue-200" },
  member:             { label: "Member",              color: "bg-slate-50 text-slate-600 border-slate-200" },
};

const FARM_ROLE_META: Record<string, { label: string }> = {
  owner:              { label: "Owner" },
  administrator:      { label: "Administrator" },
  farm_manager:       { label: "Farm Manager" },
  worker:             { label: "Worker" },
  veterinary_officer: { label: "Veterinary Officer" },
  crop_officer:       { label: "Crop Officer" },
  viewer:             { label: "Viewer" },
};

function MemberAvatar({ name, email }: { name?: string | null; email?: string | null }) {
  const initials = name
    ? name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
    : (email?.[0] ?? "?").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-slate-700">{initials}</span>
    </div>
  );
}

export default function OrgTeam() {
  const { currentFarm } = useFarm();
  const organizationId = currentFarm?.farm.organizationId ?? 0;

  const utils = trpc.useUtils();
  const { data: members = [], isLoading } = trpc.organizations.getTeam.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );

  const inviteMember = trpc.organizations.inviteMember.useMutation({
    onSuccess: () => { utils.organizations.getTeam.invalidate(); toast.success("Member added"); setInviteOpen(false); setInviteEmail(""); },
    onError: (e) => toast.error(e.message),
  });
  const updateRole = trpc.organizations.updateMemberRole.useMutation({
    onSuccess: () => { utils.organizations.getTeam.invalidate(); toast.success("Role updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deactivate = trpc.organizations.deactivateMember.useMutation({
    onSuccess: () => { utils.organizations.getTeam.invalidate(); toast.success("Member deactivated"); },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.organizations.removeMember.useMutation({
    onSuccess: () => { utils.organizations.getTeam.invalidate(); toast.success("Member removed"); },
    onError: (e) => toast.error(e.message),
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin" | "member">("member");

  if (isLoading) return (
    <div className="max-w-4xl space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Team & Permissions</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xl">
            Manage your organization's member directory. Users belong to the organization once and are assigned to farms with specific roles.
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Architecture Note */}
      <div className="flex gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Org-wide directory with farm-level roles</p>
          <p className="text-blue-700 mt-0.5 text-xs leading-relaxed">
            A user belongs to the organization once. They can then be assigned to one or more farms with different roles on each — for example, Farm Manager on Crop Farm and Viewer on Dairy Farm.
          </p>
        </div>
      </div>

      {/* Member Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {members.length} {members.length === 1 ? "Member" : "Members"}
          </span>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No team members yet</p>
            <p className="text-xs text-slate-400">Invite colleagues to join your organization.</p>
            <Button size="sm" className="gap-2 mt-2" onClick={() => setInviteOpen(true)}>
              <UserPlus className="w-4 h-4" /> Invite Member
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(members as any[]).map((member: any) => {
              const roleMeta = ROLE_META[member.role] ?? ROLE_META.member;
              return (
                <div key={member.id} className={cn("px-5 py-4 hover:bg-slate-50/50 transition-colors", !member.isActive && "opacity-50")}>
                  <div className="flex items-start gap-4">
                    <MemberAvatar name={member.name} email={member.email} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 truncate">{member.name || "Unnamed User"}</p>
                        <span className={cn("text-[11px] font-semibold border px-2 py-0.5 rounded-full", roleMeta.color)}>
                          {roleMeta.label}
                        </span>
                        {!member.isActive && (
                          <span className="text-[11px] font-semibold border px-2 py-0.5 rounded-full bg-red-50 text-red-600 border-red-200">Suspended</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>

                      {/* Farm assignments */}
                      {member.farmAssignments?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {member.farmAssignments.map((a: any) => (
                            <div key={a.farmId} className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="font-medium">{a.farmName}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500">{FARM_ROLE_META[a.farmRole]?.label ?? a.farmRole}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!member.farmAssignments || member.farmAssignments.length === 0) && (
                        <p className="text-xs text-amber-600 mt-1.5">Not assigned to any farm yet</p>
                      )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" /> Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                          <ArrowRightLeft className="w-3.5 h-3.5" /> Assign to Farm
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-sm cursor-pointer text-amber-600"
                          onClick={() => deactivate.mutate({ memberId: member.id, organizationId })}
                        >
                          <UserX className="w-3.5 h-3.5" /> {member.isActive ? "Suspend Member" : "Reinstate Member"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-sm cursor-pointer text-red-600"
                          onClick={() => remove.mutate({ memberId: member.id, organizationId })}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove from Org
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Invite Team Member
            </DialogTitle>
            <DialogDescription>
              The user must already have a KiliSense account. Enter their registered email address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Organization Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Farm-specific roles are assigned separately after the member joins.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              disabled={!inviteEmail || inviteMember.isPending}
              onClick={() => inviteMember.mutate({ organizationId, email: inviteEmail, role: inviteRole })}
            >
              {inviteMember.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
