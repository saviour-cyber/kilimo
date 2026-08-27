import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Upload, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditListing() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: categories } = trpc.marketplace.categories.useQuery();
  
  const { data, isLoading } = trpc.marketplace.get.useQuery(
    { listingId: parseInt(id!) },
    { enabled: !!id }
  );

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    price: "",
    currency: "KES",
    quantity: "",
    unit: "",
    county: "",
    location: "",
  });

  useEffect(() => {
    if (data?.listing) {
      setForm({
        title: data.listing.title,
        categoryId: data.listing.categoryId?.toString() || "",
        description: data.listing.description || "",
        price: data.listing.price.toString(),
        currency: data.listing.currency,
        quantity: data.listing.quantity?.toString() || "",
        unit: data.listing.unit || "",
        county: data.listing.county || "",
        location: data.listing.location || "",
      });
    }
  }, [data]);

  const updateListing = trpc.marketplace.update.useMutation({
    onSuccess: () => {
      toast.success("Listing updated successfully.");
      utils.marketplace.get.invalidate({ listingId: parseInt(id!) });
    },
    onError: (err) => toast.error(err.message)
  });

  const publishListing = trpc.marketplace.publish.useMutation({
    onSuccess: () => {
      toast.success("Listing published successfully!");
      utils.marketplace.get.invalidate({ listingId: parseInt(id!) });
      setLocation(`/marketplace/listing/${id}`);
    },
    onError: (err) => toast.error(err.message)
  });

  const pauseListing = trpc.marketplace.pause.useMutation({
    onSuccess: () => {
      toast.success("Listing paused.");
      utils.marketplace.get.invalidate({ listingId: parseInt(id!) });
    },
    onError: (err) => toast.error(err.message)
  });

  const uploadImage = trpc.marketplace.uploadImage.useMutation({
    onSuccess: () => {
      toast.success("Image uploaded successfully.");
      utils.marketplace.get.invalidate({ listingId: parseInt(id!) });
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteImage = trpc.marketplace.deleteImage.useMutation({
    onSuccess: () => {
      toast.success("Image deleted.");
      utils.marketplace.get.invalidate({ listingId: parseInt(id!) });
    },
    onError: (err) => toast.error(err.message)
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateListing.mutate({
      listingId: parseInt(id!),
      title: form.title,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      description: form.description,
      price: parseFloat(form.price),
      currency: form.currency,
      quantity: form.quantity ? parseFloat(form.quantity) : undefined,
      unit: form.unit,
      county: form.county,
      location: form.location,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      // Extract base64 part
      const base64 = dataUrl.split(",")[1];
      uploadImage.mutate({
        listingId: parseInt(id!),
        base64,
        contentType: file.type,
        isPrimary: data?.images?.length === 0 // Make primary if it's the first image
      });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!data?.listing) return <div>Listing not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/marketplace/listings")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Listing</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
              data.listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
            }`}>
              {data.listing.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {data.listing.status === 'draft' || data.listing.status === 'paused' ? (
            <Button 
              onClick={() => publishListing.mutate({ listingId: parseInt(id!) })}
              disabled={publishListing.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {publishListing.isPending ? "Publishing..." : "Publish Listing"}
            </Button>
          ) : data.listing.status === 'active' ? (
            <Button 
              onClick={() => pauseListing.mutate({ listingId: parseInt(id!) })}
              disabled={pauseListing.isPending}
              variant="outline"
            >
              {pauseListing.isPending ? "Pausing..." : "Pause Listing"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title" 
                    required 
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.categoryId} onValueChange={v => setForm({...form, categoryId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <div className="flex gap-2">
                      <Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KES">KES</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        id="price" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        required 
                        className="flex-1"
                        value={form.price}
                        onChange={e => setForm({...form, price: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      id="quantity" 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={form.quantity}
                      onChange={e => setForm({...form, quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input 
                      id="unit" 
                      value={form.unit}
                      onChange={e => setForm({...form, unit: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="county">County / Region</Label>
                    <Input 
                      id="county" 
                      value={form.county}
                      onChange={e => setForm({...form, county: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Specific Location</Label>
                    <Input 
                      id="location" 
                      value={form.location}
                      onChange={e => setForm({...form, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    rows={5}
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={updateListing.isPending} className="bg-teal-600 hover:bg-teal-700">
                    {updateListing.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Images</CardTitle>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/jpeg,image/png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileSelect}
                  disabled={uploadImage.isPending || (data.images?.length || 0) >= 8}
                />
                <Button size="sm" variant="outline" disabled={uploadImage.isPending || (data.images?.length || 0) >= 8}>
                  {uploadImage.isPending ? "Uploading..." : <><Upload className="w-4 h-4 mr-2"/> Add Image</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                {data.images?.map(img => (
                  <div key={img.id} className="relative group rounded-md overflow-hidden border">
                    <div className="aspect-video">
                      <img src={img.url} alt="Listing" className="w-full h-full object-cover" />
                    </div>
                    {img.isPrimary && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded shadow flex items-center font-bold">
                        <Star className="w-3 h-3 mr-1 fill-yellow-900" /> Primary
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.isPrimary && (
                        <Button size="sm" variant="secondary" onClick={() => {
                          // Make primary logic could go here
                        }}>
                          Make Primary
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteImage.mutate({ imageId: img.id, listingId: data.listing.id })}
                        disabled={deleteImage.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!data.images || data.images.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>No images yet</p>
                    <p className="text-xs mt-1">Upload at least one image to publish</p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground text-center">
                  {(data.images?.length || 0)} / 8 images uploaded
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
