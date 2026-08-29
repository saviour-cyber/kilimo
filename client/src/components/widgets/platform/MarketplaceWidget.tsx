import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export function MarketplaceWidget({ farmId }: { farmId: number }) {
  // Try to fetch recent market listings
  const { data: listings, isLoading } = trpc.marketplace.list.useQuery(
    { limit: 4 },
    { enabled: !!farmId }
  );

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-2xl" />;

  const items = listings || [];

  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-[17px] font-bold text-slate-900">What's Selling Near You</h2>
        <Link href="/marketplace/browse">
          <span className="text-[13px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer">View All ›</span>
        </Link>
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-4 -mx-5 px-5">
        <div className="flex w-max space-x-4">
          {items.length === 0 ? (
            <div className="w-[300px] h-[160px] bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-sm text-slate-500">
              No items available
            </div>
          ) : (
            items.map((item) => (
              <Link key={item.listing.id} href={`/marketplace/listing/${item.listing.id}`}>
                <div className="w-[140px] flex flex-col cursor-pointer group">
                  <div className="w-[140px] h-[100px] rounded-2xl overflow-hidden mb-2 shadow-sm border border-slate-100 bg-slate-100 flex items-center justify-center">
                    <img 
                      src={"https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&q=80&w=300"} 
                      alt={item.listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-900 truncate">{item.listing.title}</h3>
                  <p className="text-[12px] font-medium text-slate-500">KES {Number(item.listing.price).toLocaleString()} <span className="text-slate-400">/ {item.listing.unit}</span></p>
                  {item.listing.location && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.listing.location}</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}