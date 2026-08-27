import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, MapPin, Tag } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MarketplaceWidget({ farmId, className }: { farmId: number; className?: string }) {
  // Try to fetch recent market listings
  const { data: listings, isLoading } = trpc.marketplace.list.useQuery(
    { limit: 4 },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className={cn("h-[250px] rounded-xl w-full", className)} />;

  const items = listings || [];

  return (
    <Card className={cn("border shadow-sm bg-card flex flex-col", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-teal-100">
            <ShoppingBag className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <h3 className="font-bold text-[15px] font-serif text-foreground">Market Opportunities</h3>
        </div>
        <Link href="/marketplace/browse">
          <span className="text-[11px] font-bold text-muted-foreground hover:text-teal-600 cursor-pointer">View Market</span>
        </Link>
      </div>
      <CardContent className="p-0 flex flex-col flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center flex-1">
            <span className="text-sm text-muted-foreground mb-2">No market opportunities available yet.</span>
            <Link href="/marketplace/create">
              <span className="text-xs font-semibold text-teal-600 hover:underline cursor-pointer">
                List My Product ->
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <Link key={item.id} href={`/marketplace/listing/${item.id}`}>
                <div className="flex items-start justify-between px-4 py-3 hover:bg-muted cursor-pointer transition-colors">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[13px] font-semibold text-foreground truncate">{item.title}</span>
                    {item.location && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {item.location}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-3">
                    <span className="text-[13px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      KES {Number(item.price).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                      {item.unit}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}