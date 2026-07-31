import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";

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
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate({ farmId })}>
            <CheckCheck className="w-4 h-4 mr-1.5" />Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BellOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notifications</p>
        </div>
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
  );
}
