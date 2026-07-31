import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Plus, RefreshCw, Building2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

const BUSINESS_TYPES = [
  "Crop Farming", "Livestock", "Poultry", "Dairy", "Aquaculture",
  "Beekeeping", "Horticulture", "Mixed Farming", "Agri-Tech", "Other"
];

const COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "Ghana", "Nigeria", "South Africa"];

export default function AdminOrganizations() {
  const utils = trpc.useContext();
  const { data: orgs, isLoading } = trpc.admin.listOrganizations.useQuery();
  const { data: users } = trpc.admin.listUsers.useQuery();

  const createMutation = trpc.admin.createOrganization.useMutation({
    onSuccess: () => {
      toast.success("Organization created successfully.");
      utils.admin.listOrganizations.invalidate();
      setIsOpen(false);
      setForm({ name: "", businessType: "", country: "Kenya", contactEmail: "", contactPhone: "", ownerId: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteOrganization.useMutation({
    onSuccess: () => {
      toast.success("Organization deleted.");
      utils.admin.listOrganizations.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", businessType: "", country: "Kenya",
    contactEmail: "", contactPhone: "", ownerId: ""
  });

  const handleCreate = () => {
    if (!form.name || !form.businessType || !form.ownerId) {
      toast.error("Name, business type and owner are required.");
      return;
    }
    createMutation.mutate({
      name: form.name,
      businessType: form.businessType,
      country: form.country,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      ownerId: parseInt(form.ownerId),
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-slate-800">Organizations</CardTitle>
              <CardDescription>Manage all tenant organizations on the platform.</CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Plus className="w-4 h-4" /> Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    Create New Organization
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Organization Name *</Label>
                    <Input
                      placeholder="e.g. Green Valley Farms Ltd"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Type *</Label>
                      <Select value={form.businessType} onValueChange={v => setForm({ ...form, businessType: v })}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Owner (User) *</Label>
                    <Select value={form.ownerId} onValueChange={v => setForm({ ...form, ownerId: v })}>
                      <SelectTrigger><SelectValue placeholder="Assign an owner" /></SelectTrigger>
                      <SelectContent>
                        {users?.map(u => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        value={form.contactEmail}
                        onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input
                        placeholder="+254..."
                        value={form.contactPhone}
                        onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    Create Organization
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs?.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium text-slate-800">{org.name}</TableCell>
                    <TableCell className="capitalize text-slate-600">{org.businessType}</TableCell>
                    <TableCell className="text-slate-600">{org.country}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{org.contactEmail || "—"}</TableCell>
                    <TableCell className="text-slate-600">{format(new Date(org.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-rose-600 font-semibold"
                            onClick={() => {
                              if (confirm(`Delete organization "${org.name}"? This cannot be undone.`)) {
                                deleteMutation.mutate({ organizationId: org.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" /> Delete Organization
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {orgs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No organizations found on the platform.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
