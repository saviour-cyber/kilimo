import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as Icons from "lucide-react";

export default function AdminModules() {
  const { data: modules, isLoading, refetch } = trpc.admin.listModules.useQuery();
  const toggleMutation = trpc.admin.toggleModule.useMutation({
    onSuccess: () => {
      toast.success("Module status updated successfully");
      refetch();
    },
    onError: () => {
      toast.error("Failed to update module status");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Business Modules</h1>
          <p className="text-sm text-muted-foreground mt-1">Enable or disable core farming modules across the entire platform.</p>
        </div>
      </div>

      <Card className="border-border shadow-sm bg-card rounded-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[350px] font-semibold text-muted-foreground">Module</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Version</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Global Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-border h-14">
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-4 w-40" /></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : modules?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No modules found.
                  </TableCell>
                </TableRow>
              ) : (
                modules?.map((mod) => {
                  const IconComponent = (Icons as any)[mod.icon || "Box"] || Icons.Box;
                  return (
                    <TableRow key={mod.id} className="border-border hover:bg-secondary/30 h-14">
                      <TableCell className="py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border">
                            <IconComponent className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="font-medium text-foreground leading-tight">{mod.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[250px] mt-0.5">{mod.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm py-2">v{mod.version}</TableCell>
                      <TableCell className="py-2">
                        {mod.isEnabled ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-secondary text-muted-foreground border-border">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <Switch 
                          checked={mod.isEnabled}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: mod.id, isEnabled: checked })}
                          disabled={toggleMutation.isPending}
                          className="data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile / Tablet List View */}
        <div className="lg:hidden flex flex-col divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-full max-w-[200px]" /></div>
                </div>
                <Skeleton className="h-6 w-10 shrink-0 rounded-full" />
              </div>
            ))
          ) : modules?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No modules found.</div>
          ) : (
            modules?.map((mod) => {
              const IconComponent = (Icons as any)[mod.icon || "Box"] || Icons.Box;
              return (
                <div key={mod.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-secondary/20">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border">
                      <IconComponent className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{mod.name}</span>
                        {mod.isEnabled ? (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1 pr-2">{mod.description}</span>
                    </div>
                  </div>
                  <Switch 
                    checked={mod.isEnabled}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: mod.id, isEnabled: checked })}
                    disabled={toggleMutation.isPending}
                    className="data-[state=checked]:bg-primary shrink-0"
                  />
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
