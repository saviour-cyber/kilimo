import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function CreateListing() {
  const { currentFarm } = useFarm();
  const [, setLocation] = useLocation();
  const { data: categories } = trpc.marketplace.categories.useQuery();
  
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    price: "",
    currency: "KES",
    quantity: "",
    unit: "",
    county: "",
    location: currentFarm?.farm.location || "",
    contactPhone: "",
  });

  const createListing = trpc.marketplace.create.useMutation({
    onSuccess: (data) => {
      toast.success("Listing created successfully. You can now add images.");
      setLocation(`/marketplace/edit/${data.listingId}`);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFarm?.farm.id) return;

    createListing.mutate({
      farmId: currentFarm.farm.id,
      title: form.title,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      description: form.description,
      price: parseFloat(form.price),
      currency: form.currency,
      quantity: form.quantity ? parseFloat(form.quantity) : undefined,
      unit: form.unit,
      county: form.county,
      location: form.location,
      contactPhone: form.contactPhone || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/marketplace/listings")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Listing</h1>
          <p className="text-muted-foreground mt-1">List your farm produce or inputs for sale.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                required 
                placeholder="e.g. 50kg bags of fresh maize" 
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
                <Label htmlFor="quantity">Available Quantity</Label>
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
                <Label htmlFor="unit">Unit (e.g. kg, bags, tons)</Label>
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
              <Label htmlFor="contactPhone">Contact Phone Number</Label>
              <Input 
                id="contactPhone"
                type="tel"
                placeholder="e.g. +254 700 000 000"
                value={form.contactPhone}
                onChange={e => setForm({...form, contactPhone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                rows={5}
                placeholder="Describe your produce..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={createListing.isPending} className="bg-teal-600 hover:bg-teal-700">
                {createListing.isPending ? "Creating..." : "Create & Continue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
