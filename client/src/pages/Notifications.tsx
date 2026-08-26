import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const TYPE_STYLES: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  reminder: "bg-violet-100 text-violet-700",
};

export default function Notifications() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const { data: notifications = [], isLoading } = trpc.notifications.list.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
    onError: (e: any) => toast.error(e.message),
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
    onError: (e: any) => toast.error(e.message),
  });

  const unreadCount = (notifications as any[]).filter((n: any) => !n.isRead).length;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
      <PageHeader 
        title="Notifications" 
        description={`${unreadCount} unread`}
        icon={Bell}
        iconColor="text-blue-600"
        iconBg="bg-blue-100"
      >
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate({ farmId })}>
            <CheckCheck className="w-4 h-4 mr-1.5" />Mark all read
          </Button>
        )}
      </PageHeader>

      <div className="max-w-3xl space-y-4">
        {isLoading ? (
          <LoadingSkeleton variant="list" />
        ) : notifications.length === 0 ? (
          <EmptyState 
            icon={BellOff} 
            title="No notifications" 
            description="You're all caught up!" 
          />
        ) : (
        <div className="space-y-2">
          {(notifications as any[]).map((n: any) => (
            <Card
              key={n.id}
              className={cn("border-0 shadow-sm cursor-pointer transition-all hover:shadow-md", !n.isRead && "ring-1 ring-primary/20 bg-primary/5")}
              onClick={() => !n.isRead && markRead.mutate({ notificationId: n.id, farmId })}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0", TYPE_STYLES[n.type ?? "info"])}>
                    {n.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-sm text-foreground", !n.isRead && "font-semibold")}>{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
