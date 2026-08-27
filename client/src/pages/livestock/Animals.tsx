import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Beef, Plus, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  sold: "bg-blue-100 text-blue-700",
  deceased: "bg-muted text-muted-foreground",
  transferred: "bg-purple-100 text-purple-700",
};

function AnimalForm({ farmId, animal, onClose }: { farmId: number; animal?: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    tagNumber: animal?.tagNumber ?? "",
    name: animal?.name ?? "",
    species: animal?.species ?? "",
    breed: animal?.breed ?? "",
    gender: animal?.gender ?? "unknown",
    dateOfBirth: animal?.dateOfBirth ? String(animal.dateOfBirth).slice(0, 10) : "",
    acquisitionDate: animal?.acquisitionDate ? String(animal.acquisitionDate).slice(0, 10) : "",
    acquisitionType: animal?.acquisitionType ?? "born",
    weight: animal?.weight ? String(animal.weight) : "",
    weightUnit: animal?.weightUnit ?? "kg",
    notes: animal?.notes ?? "",
  });

  const create = trpc.livestock.createAnimal.useMutation({
    onSuccess: () => { utils.livestock.listAnimals.invalidate(); toast.success("Animal added"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.livestock.updateAnimal.useMutation({
    onSuccess: () => { utils.livestock.listAnimals.invalidate(); toast.success("Animal updated"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (animal) update.mutate({ ...form, animalId: animal.id, farmId });
    else create.mutate({ ...form, farmId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tag Number</Label>
          <Input value={form.tagNumber} onChange={(e) => setForm({ ...form, tagNumber: e.target.value })} placeholder="e.g. KE-001" />
        </div>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bessie" />
        </div>
        <div className="space-y-1.5">
          <Label>Species *</Label>
          <Input value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} placeholder="e.g. Cattle" required />
        </div>
        <div className="space-y-1.5">
          <Label>Breed</Label>
          <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="e.g. Friesian" />
        </div>
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Acquisition Type</Label>
          <Select value={form.acquisitionType} onValueChange={(v) => setForm({ ...form, acquisitionType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["born", "purchased", "donated", "other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date of Birth</Label>
          <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Acquisition Date</Label>
          <Input type="date" value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Weight</Label>
          <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Weight Unit</Label>
          <Select value={form.weightUnit} onValueChange={(v) => setForm({ ...form, weightUnit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="lbs">lbs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {animal ? "Update" : "Add"} Animal
        </Button>
      </div>
    </form>
  );
}

export default function Animals() {
  const { currentFarm, can } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState<any>(null);
  const [speciesFilter, setSpeciesFilter] = useState("");

  const { data: animals = [], isLoading } = trpc.livestock.listAnimals.useQuery(
    { farmId, species: speciesFilter || undefined },
    { enabled: !!farmId }
  );

  const speciesList = Array.from(new Set(animals.map((a) => a.species)));
  const activeCount = animals.filter((a) => a.status === "active").length;

  return (
    <LivestockLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{activeCount} active Â· {animals.length} total</span>
          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All species</SelectItem>
              {speciesList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {can("write") && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add Animal
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="cards" />
      ) : animals.length === 0 ? (
        <EmptyState 
          icon={Beef} 
          title="No animals registered" 
          description="Add your first animal to start tracking" 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {animals.map((animal) => (
            <Card key={animal.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {animal.tagNumber && (
                        <span className="flex items-center gap-1 text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          <Tag className="w-3 h-3" />{animal.tagNumber}
                        </span>
                      )}
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[animal.status])}>
                        {animal.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm leading-none">{animal.name ?? animal.species}</h3>
                    <div className="text-xs text-muted-foreground pt-1 space-y-0.5">
                      <p>{animal.species}{animal.breed ? ` Â· ${animal.breed}` : ""}</p>
                      <p className="capitalize">{animal.gender}{animal.weight ? ` Â· ${animal.weight} ${animal.weightUnit}` : ""}</p>
                      {animal.dateOfBirth && <p>Born: {String(animal.dateOfBirth).slice(0, 10)}</p>}
                    </div>
                  </div>
                  {can("write") && (
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditAnimal(animal)}>Edit</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Animal</DialogTitle></DialogHeader>
          <AnimalForm farmId={farmId} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editAnimal} onOpenChange={(o) => !o && setEditAnimal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Animal</DialogTitle></DialogHeader>
          {editAnimal && <AnimalForm farmId={farmId} animal={editAnimal} onClose={() => setEditAnimal(null)} />}
        </DialogContent>
      </Dialog>
    </LivestockLayout>
  );
}
