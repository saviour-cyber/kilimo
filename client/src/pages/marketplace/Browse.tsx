import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tag, MapPin, Search, Store } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full space-y-6">
      <PageHeader 
        title="Marketplace" 
        description="Browse farm produce, livestock, and inputs across KiliSense"
        icon={Store}
        iconColor="text-primary"
        iconBg="bg-primary/10"
      />

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
        <LoadingSkeleton variant="cards" />
      ) : listings?.length === 0 ? (
        <EmptyState 
          icon={Store} 
          title="No listings found" 
          description="Try adjusting your filters or search term." 
        />
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
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                    <Store className="w-8 h-8 opacity-20" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {category && (
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-white shadow-sm text-muted-foreground">
                      {category.name}
                    </span>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-semibold line-clamp-2 text-sm">{listing.title}</h3>
                </div>
                <p className="font-bold text-lg text-primary mb-2">
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
