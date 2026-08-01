import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ShieldAlert, Activity, User, Box, Server, Settings } from "lucide-react";

export default function AdminAuditLogs() {
  const { data: logs, isLoading } = trpc.admin.getAuditLogs.useQuery();

  const getIconForAction = (action: string) => {
    if (action.includes("MODULE")) return <Box className="w-4 h-4 text-purple-500" />;
    if (action.includes("SERVICE")) return <Server className="w-4 h-4 text-blue-500" />;
    if (action.includes("USER")) return <User className="w-4 h-4 text-emerald-500" />;
    return <Activity className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800">System Activity Trail</CardTitle>
          <CardDescription>Immutable record of all administrative actions across the platform.</CardDescription>
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
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                )}
                {logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {log.user?.name?.charAt(0) || "U"}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{log.user?.name || "System"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIconForAction(log.action)}
                        <Badge variant="outline" className="font-mono text-xs bg-slate-50">
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {log.entityType ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {log.description ?? JSON.stringify(log.metadata)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
