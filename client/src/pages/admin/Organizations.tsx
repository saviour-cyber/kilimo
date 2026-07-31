import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Power, Play, Trash2, ArrowUpCircle, Users, Sprout, LogIn } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AdminOrganizations() {
  const { data: orgs, isLoading } = trpc.admin.listOrganizations.useQuery();

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-slate-800">Organizations</CardTitle>
            <CardDescription>Manage all tenant organizations on the platform.</CardDescription>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">Add Organization</Button>
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
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs?.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium text-slate-800">{org.name}</TableCell>
                  <TableCell className="capitalize text-slate-600">{org.businessType}</TableCell>
                  <TableCell className="text-slate-600">{org.country}</TableCell>
                  <TableCell className="text-slate-600">{format(new Date(org.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {/* Mocked Status for now */}
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Active</Badge>
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
                        <DropdownMenuItem className="gap-2 text-slate-600"><Sprout className="w-4 h-4" /> View Farms</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-slate-600"><Users className="w-4 h-4" /> View Users</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-slate-600"><ArrowUpCircle className="w-4 h-4" /> Upgrade Plan</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-amber-600"><LogIn className="w-4 h-4" /> Login as Admin</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-rose-600"><Power className="w-4 h-4" /> Suspend Organization</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-rose-600 font-semibold"><Trash2 className="w-4 h-4" /> Delete Organization</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {orgs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No organizations found on the platform.
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
