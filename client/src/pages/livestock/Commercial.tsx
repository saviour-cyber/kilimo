import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, TrendingUp, Plus, Edit2, Tag } from "lucide-react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatDate } from "@/lib/utils";

export default function Commercial() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const utils = trpc.useUtils();

  const [open, setOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);

  const [form, setForm] = useState({
    animalId: "",
    purchasePrice: "",
    purchaseDate: "",
    sellerInfo: "",
    salePrice: "",
    saleDate: "",
    buyerInfo: "",
    saleWeight: "",
    status: "active" as any,
  });

  const { data: animals = [], isLoading } = trpc.livestock.listAnimals.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const updateAnimal = trpc.livestock.updateAnimal.useMutation({
    onSuccess: () => {
      utils.livestock.listAnimals.invalidate();
      toast.success("Commercial valuation updated");
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleOpenCommercialDialog = (animal?: any) => {
    setSelectedAnimal(animal || null);
    if (animal) {
      setForm({
        animalId: String(animal.id),
        purchasePrice: animal.purchasePrice ? String(animal.purchasePrice) : "",
        purchaseDate: animal.purchaseDate ? String(animal.purchaseDate).slice(0, 10) : "",
        sellerInfo: animal.sellerInfo || "",
        salePrice: animal.salePrice ? String(animal.salePrice) : "",
        saleDate: animal.saleDate ? String(animal.saleDate).slice(0, 10) : "",
        buyerInfo: animal.buyerInfo || "",
        saleWeight: animal.saleWeight ? String(animal.saleWeight) : "",
        status: animal.status || "active",
      });
    } else {
      setForm({
        animalId: "",
        purchasePrice: "",
        purchaseDate: "",
        sellerInfo: "",
        salePrice: "",
        saleDate: "",
        buyerInfo: "",
        saleWeight: "",
        status: "active",
      });
    }
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = selectedAnimal ? selectedAnimal.id : parseInt(form.animalId);
    if (!id) return toast.error("Please select an animal");

    updateAnimal.mutate({
      animalId: id,
      farmId,
      purchasePrice: form.purchasePrice || undefined,
      purchaseDate: form.purchaseDate || undefined,
      sellerInfo: form.sellerInfo || undefined,
      salePrice: form.salePrice || undefined,
      saleDate: form.saleDate || undefined,
      buyerInfo: form.buyerInfo || undefined,
      saleWeight: form.saleWeight || undefined,
      status: form.status,
    });
  };

  // Financial aggregates
  const totalPurchaseValuation = animals.reduce(
    (acc, a) => acc + (parseFloat(String(a.purchasePrice || 0)) || 0),
    0
  );
  const totalSalesValuation = animals.reduce(
    (acc, a) => acc + (parseFloat(String(a.salePrice || 0)) || 0),
    0
  );
  const soldAnimalsCount = animals.filter((a) => a.status === "sold").length;

  return (
    <LivestockLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Commercial, Purchases & Sales</h2>
            <p className="text-sm text-muted-foreground">
              Manage livestock acquisition costs, sales revenues, buyer/seller tracking, and asset valuations
            </p>
          </div>
          <Button onClick={() => handleOpenCommercialDialog()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Log Valuation / Sale
          </Button>
        </div>

        {/* Aggregate KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" /> Total Acquisitions Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPurchaseValuation.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Capital invested in purchased livestock</p>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" /> Total Sales Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ${totalSalesValuation.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{soldAnimalsCount} animals sold to date</p>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" /> Net Livestock Realization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totalSalesValuation - totalPurchaseValuation >= 0 ? "text-blue-600" : "text-amber-600"
                }`}
              >
                ${(totalSalesValuation - totalPurchaseValuation).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gross commercial margin on livestock trades</p>
            </CardContent>
          </Card>
        </div>

        {/* Commercial Animals Table */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : animals.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No animals found"
            description="Register animals first to attach purchase costs or record sales."
          />
        ) : (
          <div className="border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground font-medium">
                  <tr>
                    <th className="text-left px-4 py-3">Animal</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Purchase Price & Seller</th>
                    <th className="text-left px-4 py-3">Purchase Date</th>
                    <th className="text-left px-4 py-3">Sale Price & Buyer</th>
                    <th className="text-left px-4 py-3">Sale Date / Weight</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {animals.map((a: any) => (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {a.name || a.tagNumber || `Animal #${a.id}`}
                        <span className="text-xs text-muted-foreground block capitalize">
                          {a.species} {a.breed ? `• ${a.breed}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={`text-xs capitalize ${
                            a.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : a.status === "sold"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {a.purchasePrice ? (
                          <div>
                            <span className="font-semibold text-foreground">${parseFloat(a.purchasePrice).toLocaleString()}</span>
                            {a.sellerInfo && (
                              <span className="text-xs text-muted-foreground block">Seller: {a.sellerInfo}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {a.purchaseDate ? formatDate(a.purchaseDate) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {a.salePrice ? (
                          <div>
                            <span className="font-semibold text-emerald-700">${parseFloat(a.salePrice).toLocaleString()}</span>
                            {a.buyerInfo && (
                              <span className="text-xs text-muted-foreground block">Buyer: {a.buyerInfo}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {a.saleDate ? (
                          <div>
                            <span>{formatDate(a.saleDate)}</span>
                            {a.saleWeight && (
                              <span className="text-muted-foreground block font-mono">{a.saleWeight} kg</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs flex items-center gap-1 ml-auto"
                          onClick={() => handleOpenCommercialDialog(a)}
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dialog for Edit / Record Valuation */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedAnimal
                  ? `Commercial Details: ${selectedAnimal.name || selectedAnimal.tagNumber || `#${selectedAnimal.id}`}`
                  : "Record Purchase / Sale Record"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {!selectedAnimal && (
                <div className="space-y-1.5">
                  <Label>Select Animal *</Label>
                  <Select
                    value={form.animalId}
                    onValueChange={(val) => setForm({ ...form, animalId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose animal" />
                    </SelectTrigger>
                    <SelectContent>
                      {animals.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name || a.tagNumber || `Animal #${a.id}`} ({a.species})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-3 bg-muted/40 rounded-lg space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Acquisition / Purchase
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Purchase Price ($)</Label>
                    <Input
                      type="number"
                      value={form.purchasePrice}
                      onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                      placeholder="e.g., 1200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Purchase Date</Label>
                    <Input
                      type="date"
                      value={form.purchaseDate}
                      onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Seller / Breeder Source</Label>
                  <Input
                    value={form.sellerInfo}
                    onChange={(e) => setForm({ ...form, sellerInfo: e.target.value })}
                    placeholder="e.g., Green Pastures Livestock Ltd"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg space-y-3">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                  Sale & Dispatch
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Sale Price ($)</Label>
                    <Input
                      type="number"
                      value={form.salePrice}
                      onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                      placeholder="e.g., 1850"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sale Date</Label>
                    <Input
                      type="date"
                      value={form.saleDate}
                      onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Buyer Information</Label>
                    <Input
                      value={form.buyerInfo}
                      onChange={(e) => setForm({ ...form, buyerInfo: e.target.value })}
                      placeholder="e.g., Local Abattoir or Farmer Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sale Weight (kg)</Label>
                    <Input
                      type="number"
                      value={form.saleWeight}
                      onChange={(e) => setForm({ ...form, saleWeight: e.target.value })}
                      placeholder="e.g., 480"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val: any) => setForm({ ...form, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active On Farm</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAnimal.isPending}>
                  Save Commercial Data
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </LivestockLayout>
  );
}
