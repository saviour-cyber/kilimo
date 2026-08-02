import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Settings, CheckCircle2, XCircle, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminServices() {
  const { data: services, isLoading, refetch } = trpc.admin.listServices.useQuery();
  const toggleMutation = trpc.admin.toggleService.useMutation({
    onSuccess: () => {
      toast.success("Service status updated successfully");
      refetch();
    },
    onError: () => {
      toast.error("Failed to update service status");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Platform Services</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure global platform infrastructure services and APIs.</p>
        </div>
      </div>

      <Card className="border-border shadow-sm bg-card rounded-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[350px] font-semibold text-muted-foreground">Service</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Configuration</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Global Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-border h-14">
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-4 w-40" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : services?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No services found.
                  </TableCell>
                </TableRow>
              ) : (
                services?.map((srv) => (
                  <TableRow key={srv.id} className="border-border hover:bg-secondary/30 h-14">
                    <TableCell className="py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border">
                          <Server className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="font-medium text-foreground leading-tight">{srv.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[250px] mt-0.5">{srv.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {srv.isEnabled ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-secondary text-muted-foreground border-border gap-1.5">
                          <XCircle className="w-3 h-3" /> Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Button variant="outline" size="sm" className="gap-2 h-8 border-border bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <Settings className="w-3.5 h-3.5" /> Configure
                      </Button>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Switch 
                        checked={srv.isEnabled}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: srv.id, isEnabled: checked })}
                        disabled={toggleMutation.isPending}
                        className="data-[state=checked]:bg-primary"
                      />
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
              <div key={i} className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-full max-w-[200px]" /></div>
                </div>
                <div className="flex justify-between items-center pl-13 pt-1 border-t border-border mt-1">
                   <Skeleton className="h-8 w-24 rounded-md" />
                   <Skeleton className="h-6 w-10 shrink-0 rounded-full" />
                </div>
              </div>
            ))
          ) : services?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No services found.</div>
          ) : (
            services?.map((srv) => (
              <div key={srv.id} className="p-3.5 flex flex-col gap-3 hover:bg-secondary/20">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border">
                    <Server className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">{srv.name}</span>
                      {srv.isEnabled ? (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1 pr-2">{srv.description}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-1 pl-[52px]">
                  <Button variant="outline" size="sm" className="gap-2 h-8 text-xs border-border bg-transparent text-muted-foreground hover:bg-secondary">
                    <Settings className="w-3.5 h-3.5" /> Config
                  </Button>
                  <Switch 
                    checked={srv.isEnabled}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: srv.id, isEnabled: checked })}
                    disabled={toggleMutation.isPending}
                    className="data-[state=checked]:bg-primary shrink-0"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
