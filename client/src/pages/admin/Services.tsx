import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Settings, CheckCircle2, XCircle } from "lucide-react";
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
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-slate-800">Platform Services</CardTitle>
            <CardDescription>Configure global platform infrastructure services and APIs.</CardDescription>
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
                <TableHead className="w-[300px]">Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Configuration</TableHead>
                <TableHead className="text-right">Global Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.map((srv) => (
                <TableRow key={srv.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="font-semibold text-slate-800">{srv.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{srv.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {srv.isEnabled ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none gap-1">
                        <XCircle className="w-3 h-3" /> Offline
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="w-4 h-4" /> Configure
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch 
                      checked={srv.isEnabled}
                      onCheckedChange={(checked) => {
                        toggleMutation.mutate({ id: srv.id, isEnabled: checked });
                      }}
                      disabled={toggleMutation.isPending}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
