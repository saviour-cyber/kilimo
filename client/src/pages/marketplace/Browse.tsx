import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tag, MapPin, Search, Store } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Browse() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();

  const { data: categories } = trpc.marketplace.categories.useQuery();
  const { data: listings, isLoading } = trpc.marketplace.list.useQuery({
    search: search || undefined,
    categoryId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Marketplace</h1>
        <p className="text-muted-foreground mt-1">Browse farm produce, livestock, and inputs across KiliSense.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search listings..." 
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
          <Button 
            variant={categoryId === undefined ? "default" : "outline"}
            onClick={() => setCategoryId(undefined)}
            className="whitespace-nowrap"
          >
            All Categories
          </Button>
          {categories?.map(c => (
            <Button 
              key={c.id}
              variant={categoryId === c.id ? "default" : "outline"}
              onClick={() => setCategoryId(c.id)}
              className="whitespace-nowrap"
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : listings?.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <Store className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings?.map(({ listing, category, primaryImage, orgName }) => (
            <Card 
              key={listing.id} 
              className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setLocation(`/marketplace/listing/${listing.id}`)}
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {primaryImage ? (
                  <img 
                    src={primaryImage.url} 
                    alt={listing.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-slate-100">
                    <Store className="w-8 h-8 opacity-20" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {category && (
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-white shadow-sm text-slate-700">
                      {category.name}
                    </span>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-semibold line-clamp-2 text-sm">{listing.title}</h3>
                </div>
                <p className="font-bold text-lg text-teal-700 mb-2">
                  {listing.currency} {parseFloat(listing.price.toString()).toLocaleString()}
                </p>
                
                <div className="text-xs text-muted-foreground space-y-1.5 mt-auto">
                  <p className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> {orgName}</p>
                  {listing.location && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {listing.location}</p>}
                  {listing.quantity && listing.unit && <p className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {listing.quantity} {listing.unit}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
