import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ShieldOff, KeyRound, Ban, Building2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminUsers() {
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery();

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-slate-800">Platform Users</CardTitle>
            <CardDescription>Manage all registered users across the entire platform.</CardDescription>
          </div>
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-slate-200">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-800 leading-tight">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={user.role === "admin" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-600"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-slate-600">{format(new Date(user.lastSignedIn), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Verified</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-slate-600"><Building2 className="w-4 h-4" /> Assign Organization</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-slate-600"><KeyRound className="w-4 h-4" /> Reset Password</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-amber-600"><Ban className="w-4 h-4" /> Disable Login</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-rose-600 font-semibold"><ShieldOff className="w-4 h-4" /> Suspend User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No users found on the platform.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
