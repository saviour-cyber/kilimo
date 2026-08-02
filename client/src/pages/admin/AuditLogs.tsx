import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ShieldAlert, Activity, User, Box, Server, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminAuditLogs() {
  const { data: logs, isLoading } = trpc.admin.getAuditLogs.useQuery();

  const getIconForAction = (action: string) => {
    if (action.includes("MODULE")) return <Box className="w-3.5 h-3.5 text-purple-500" />;
    if (action.includes("SERVICE")) return <Server className="w-3.5 h-3.5 text-blue-500" />;
    if (action.includes("USER")) return <User className="w-3.5 h-3.5 text-emerald-500" />;
    return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Immutable record of all administrative actions across the platform.</p>
        </div>
      </div>

      <Card className="border-border shadow-sm bg-card rounded-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[180px] font-semibold text-muted-foreground">Timestamp</TableHead>
                <TableHead className="w-[200px] font-semibold text-muted-foreground">Admin User</TableHead>
                <TableHead className="w-[150px] font-semibold text-muted-foreground">Action</TableHead>
                <TableHead className="w-[120px] font-semibold text-muted-foreground">Entity</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border h-12">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-6 w-6 rounded-full" /><Skeleton className="h-4 w-24" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  </TableRow>
                ))
              ) : logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs?.map((log) => (
                  <TableRow key={log.id} className="border-border hover:bg-secondary/30 h-12">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border border-border bg-secondary">
                          <AvatarFallback className="bg-transparent text-foreground text-[10px] font-semibold">
                            {log.user?.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{log.user?.name || "System"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] bg-background border-border text-foreground flex w-fit gap-1.5 px-1.5 py-0.5">
                        {getIconForAction(log.action)}
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.entityType ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                      {log.description ?? JSON.stringify(log.metadata)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile / Tablet List View */}
        <div className="lg:hidden flex flex-col divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Skeleton className="h-6 w-6 rounded-full" /><Skeleton className="h-4 w-24" /></div>
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          ) : logs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit logs found.</div>
          ) : (
            logs?.map((log) => (
              <div key={log.id} className="p-3.5 flex flex-col gap-2.5 hover:bg-secondary/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-border bg-secondary">
                      <AvatarFallback className="bg-transparent text-foreground text-[10px] font-semibold">
                        {log.user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{log.user?.name || "System"}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(log.createdAt), "MMM d, HH:mm")}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] bg-background border-border text-foreground flex w-fit gap-1.5 px-1.5 py-0.5">
                    {getIconForAction(log.action)}
                    {log.action}
                  </Badge>
                  {log.entityType && (
                    <span className="text-xs text-muted-foreground">on <span className="font-medium text-foreground">{log.entityType}</span></span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {log.description ?? JSON.stringify(log.metadata)}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
