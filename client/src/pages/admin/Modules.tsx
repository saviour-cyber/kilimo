import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-slate-800">Business Modules</CardTitle>
            <CardDescription>Enable or disable core farming modules across the entire platform.</CardDescription>
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
                <TableHead className="w-[300px]">Module</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Global Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules?.map((mod) => {
                const IconComponent = (Icons as any)[mod.icon || "Box"] || Icons.Box;

                return (
                  <TableRow key={mod.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{mod.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{mod.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-mono text-sm">v{mod.version}</TableCell>
                    <TableCell>
                      {mod.isEnabled ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Active</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch 
                        checked={mod.isEnabled}
                        onCheckedChange={(checked) => {
                          toggleMutation.mutate({ id: mod.id, isEnabled: checked });
                        }}
                        disabled={toggleMutation.isPending}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
