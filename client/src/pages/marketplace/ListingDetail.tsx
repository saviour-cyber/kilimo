import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Store, Tag, User } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState } from "react";

export default function ListingDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading } = trpc.marketplace.get.useQuery(
    { listingId: parseInt(id!) },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="w-full aspect-video rounded-xl" />
        <Skeleton className="w-2/3 h-10" />
        <Skeleton className="w-1/3 h-6" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Listing not found</h2>
        <Button variant="link" onClick={() => setLocation("/marketplace/browse")}>Back to Marketplace</Button>
      </div>
    );
  }

  const { listing, category, images, orgName, sellerName, farmName } = data;

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" className="mb-6 -ml-4" onClick={() => setLocation("/marketplace/browse")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to listings
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images Column */}
        <div className="space-y-4">
          <div className="aspect-video bg-muted rounded-xl overflow-hidden border">
            {images && images.length > 0 ? (
              <img 
                src={images[activeImage].url} 
                alt={listing.title} 
                className="w-full h-full object-contain bg-slate-900/5"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <Store className="w-12 h-12 mb-2 opacity-20" />
                <p>No images provided</p>
              </div>
            )}
          </div>
          
          {images && images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button 
                  key={img.id}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 ${activeImage === idx ? 'border-teal-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img.url} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="flex flex-col">
          <div className="flex gap-2 mb-3">
            {category && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-50 text-teal-700">
                {category.name}
              </span>
            )}
            <span className={`px-2.5 py-1 text-xs font-semibold rounded ${
              listing.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'
            }`}>
              {listing.status.toUpperCase()}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">{listing.title}</h1>
          
          <div className="text-3xl font-bold text-teal-700 mb-6 pb-6 border-b">
            {listing.currency} {parseFloat(listing.price.toString()).toLocaleString()}
          </div>

          <div className="space-y-4 mb-8 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Store className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{orgName}</p>
                <p className="text-xs">Organization</p>
              </div>
            </div>
            {farmName && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{farmName}</p>
                  <p className="text-xs">Farm Origin</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{sellerName}</p>
                <p className="text-xs">Listed By</p>
              </div>
            </div>
            {listing.quantity && listing.unit && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Tag className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{listing.quantity} {listing.unit}</p>
                  <p className="text-xs">Available Quantity</p>
                </div>
              </div>
            )}
            {listing.location && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{listing.location}</p>
                  <p className="text-xs">Location</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {listing.description || "No description provided."}
            </p>
          </div>

          <div className="mt-auto">
            <Button size="lg" className="w-full text-lg h-14 bg-teal-600 hover:bg-teal-700">
              Contact Seller
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
