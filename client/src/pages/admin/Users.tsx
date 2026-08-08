import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ShieldCheck, ShieldOff, Trash2, Users, Mail, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function AdminUsers() {
  const utils = trpc.useContext();
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery();

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`User role updated to ${vars.role}.`);
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully.");
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Platform Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all registered users across the entire platform.</p>
        </div>
        <Badge variant="outline" className="text-muted-foreground w-fit bg-secondary/30">
          {users?.length ?? 0} total users
        </Badge>
      </div>

      <Card className="border-border shadow-sm bg-card rounded-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">User</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Role</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Joined</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Last Active</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><div className="flex gap-3 items-center"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id} className="border-border hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border bg-secondary">
                          <AvatarFallback className="bg-transparent text-foreground text-xs font-semibold">
                            {user.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground leading-tight">{user.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.role === "admin"
                            ? "border-primary/30 text-primary bg-primary/10"
                            : "border-border text-foreground"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(user.lastSignedIn), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-border bg-card text-foreground">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border" />
                          {user.role === "user" ? (
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => {
                                if (confirm("Promote to Admin?")) updateRoleMutation.mutate({ userId: user.id, role: "admin" });
                              }}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" /> Promote to Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => {
                                if (confirm("Demote to User?")) updateRoleMutation.mutate({ userId: user.id, role: "user" });
                              }}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" /> Demote to User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem 
                            className="text-destructive cursor-pointer focus:text-destructive"
                            onClick={() => {
                              if (confirm("Permanently delete this user?")) deleteUserMutation.mutate({ userId: user.id });
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
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
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></div>
                <Skeleton className="h-3 w-48" />
              </div>
            ))
          ) : users?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found.</div>
          ) : (
            users?.map((user) => (
              <div key={user.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-border bg-secondary shrink-0">
                      <AvatarFallback className="bg-transparent text-foreground text-sm font-semibold">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-foreground leading-none">{user.name}</div>
                      <div className="text-xs text-muted-foreground break-all">{user.email}</div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-border bg-card">
                      {user.role === "user" ? (
                        <DropdownMenuItem className="cursor-pointer" onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "admin" })}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Make Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="cursor-pointer" onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "user" })}>
                          <ShieldOff className="mr-2 h-4 w-4" /> Make User
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem className="text-destructive cursor-pointer focus:text-destructive" onClick={() => deleteUserMutation.mutate({ userId: user.id })}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-secondary/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Role</p>
                    <Badge variant="outline" className={user.role === "admin" ? "bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0" : "border-border text-foreground text-[10px] px-1.5 py-0"}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Joined</p>
                    <p className="text-xs font-medium text-foreground flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" /> {format(new Date(user.createdAt), "MMM d, yy")}</p>
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
