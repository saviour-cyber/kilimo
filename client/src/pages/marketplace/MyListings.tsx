import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";

export default function MyListings() {
  const { currentFarm } = useFarm();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"all" | "draft" | "active" | "paused" | "sold" | "archived">("all");

  const { data: listings, isLoading } = trpc.marketplace.myListings.useQuery(
    { farmId: currentFarm?.farm.id ?? 0, status },
    { enabled: !!currentFarm?.farm.id }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Listings</h1>
          <p className="text-muted-foreground mt-1">Manage your farm's marketplace listings.</p>
        </div>
        <Button onClick={() => setLocation("/marketplace/create")} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Listing
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={status} onValueChange={(val: any) => setStatus(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : listings?.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground mb-6">You haven't created any listings matching this status.</p>
            <Button onClick={() => setLocation("/marketplace/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map(({ listing, category, primaryImage }) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-muted relative">
                {primaryImage ? (
                  <img src={primaryImage.url} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Tag className="w-8 h-8 opacity-20" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-sm shadow-sm ${
                    listing.status === 'active' ? 'text-green-600' :
                    listing.status === 'draft' ? 'text-muted-foreground' :
                    listing.status === 'sold' ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {listing.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold truncate pr-2">{listing.title}</h3>
                  <p className="font-bold whitespace-nowrap text-teal-700">
                    {listing.currency} {parseFloat(listing.price.toString()).toLocaleString()}
                  </p>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                  {category && <p className="flex items-center gap-1"><Tag className="w-3 h-3" /> {category.name}</p>}
                  {listing.location && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.location}</p>}
                  {listing.quantity && listing.unit && <p>Qty: {listing.quantity} {listing.unit}</p>}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="w-full" onClick={() => setLocation(`/marketplace/listing/${listing.id}`)}>
                    View
                  </Button>
                  <Button variant="default" className="w-full" onClick={() => setLocation(`/marketplace/edit/${listing.id}`)}>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
