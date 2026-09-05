import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldAlert, Heart, Flame, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function AnimalAiInsightsWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data: intel, isLoading, refetch } = trpc.intelligence.getAnimalInsights.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const evaluateAlerts = trpc.intelligence.evaluateAnimalAlerts.useMutation({
    onSuccess: (res: { success: boolean; dispatchedCount: number }) => {
      toast.success(`Evaluated AI checks: ${res.dispatchedCount} alert notification(s) dispatched`);
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <Skeleton className={cn("h-[260px] rounded-xl w-full", className)} />;
  }

  const alerts = intel?.alerts || [];

  return (
    <Card className={cn("border shadow-sm bg-white flex flex-col overflow-hidden", className)}>
      <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-purple-100 text-purple-700">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-[13px] text-foreground">KiliSense AI Animal Insights</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-2 text-purple-700 hover:bg-purple-100"
            disabled={evaluateAlerts.isPending}
            onClick={() => evaluateAlerts.mutate({ farmId })}
          >
            {evaluateAlerts.isPending ? "Running..." : "Evaluate AI"}
          </Button>
          <Link href="/livestock/heat-gestation">
            <span className="text-[11px] font-bold text-muted-foreground hover:text-purple-600 cursor-pointer">
              Details
            </span>
          </Link>
        </div>
      </div>

      <CardContent className="p-3.5 flex flex-col gap-3 text-sm">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>Optimal welfare: No drug withdrawals, imminent calving, or estrus anomalies detected.</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {alerts.map((alert: any, idx: number) => {
              const isCritical = alert.severity === "critical";
              const isWarning = alert.severity === "warning";
              const isHeat = alert.type === "heat_window";
              const isCalving = alert.type === "imminent_calving" || alert.type === "overdue_calving";
              const isWithdrawal = alert.type === "withdrawal_warning";

              return (
                <div
                  key={`${alert.id || idx}`}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-md border text-xs",
                    isCritical
                      ? "bg-red-50 border-red-200 text-red-900"
                      : isHeat
                      ? "bg-orange-50 border-orange-200 text-orange-900"
                      : isCalving
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-muted/40 border-border text-foreground"
                  )}
                >
                  {isWithdrawal ? (
                    <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : isHeat ? (
                    <Flame className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  ) : isCalving ? (
                    <Heart className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1">
                    <span className="font-semibold">{alert.animalNameOrTag}: </span>
                    <span>{alert.message}</span>
                  </div>

                  <Badge
                    variant={isCritical ? "destructive" : "secondary"}
                    className="text-[9px] px-1.5 py-0 uppercase"
                  >
                    {alert.severity}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
