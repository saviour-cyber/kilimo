import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Plus, RefreshCw, Building2, User, Phone, MapPin, Mail } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tenant organizations and their subscription states.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-9 px-4 rounded-md">
              <Plus className="w-4 h-4" /> Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-xl border border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Building2 className="w-5 h-5 text-primary" />
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
                  className="bg-background border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Type *</Label>
                  <Select value={form.businessType} onValueChange={v => setForm({ ...form, businessType: v })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Owner *</Label>
                <Select value={form.ownerId} onValueChange={v => setForm({ ...form, ownerId: v })}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select owner (user)" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@company.com"
                    value={form.contactEmail}
                    onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    placeholder="+254..."
                    value={form.contactPhone}
                    onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)} className="border-border hover:bg-secondary">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary text-primary-foreground">
                {createMutation.isPending ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm bg-card rounded-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Organization</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Contact</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Farms / Users</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Created</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orgs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                orgs?.map((org) => (
                  <TableRow key={org.id} className="border-border hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{org.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{org.businessType}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {org.country}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">{org.contactEmail || "No email"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{org.contactPhone || "No phone"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={org.isActive ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                        {org.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">
                        {org.farmCount} farms
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {org.userCount} users
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(org.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-border">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">Edit Organization</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem 
                            className="text-destructive cursor-pointer focus:text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this organization?")) {
                                deleteMutation.mutate({ organizationId: org.id });
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile / Tablet Stacked Cards View */}
        <div className="lg:hidden flex flex-col divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-center gap-3"><Skeleton className="w-8 h-8 rounded" /><Skeleton className="h-4 w-32" /></div>
                <Skeleton className="h-3 w-48" />
              </div>
            ))
          ) : orgs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No organizations found.</div>
          ) : (
            orgs?.map((org) => (
              <div key={org.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{org.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <span>{org.businessType}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3" /> {org.country}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-border">
                      <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Edit</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive cursor-pointer focus:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure?")) {
                            deleteMutation.mutate({ organizationId: org.id });
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-secondary/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Status</p>
                    <Badge variant="outline" className={org.isActive ? "bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0" : "bg-destructive/10 text-destructive border-destructive/20 text-[10px] px-1.5 py-0"}>
                      {org.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Stats</p>
                    <p className="text-xs font-medium text-foreground">{org.farmCount} Farms, {org.userCount} Users</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2.5 col-span-2 flex flex-col gap-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Contact Info</p>
                    {org.contactEmail && <p className="text-xs text-foreground flex items-center gap-1.5"><Mail className="w-3 h-3 text-muted-foreground" /> {org.contactEmail}</p>}
                    {org.contactPhone && <p className="text-xs text-foreground flex items-center gap-1.5"><Phone className="w-3 h-3 text-muted-foreground" /> {org.contactPhone}</p>}
                    {!org.contactEmail && !org.contactPhone && <p className="text-xs text-muted-foreground">No contact info provided</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
