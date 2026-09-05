import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Flame, Heart, Calendar, Plus, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import LivestockLayout from "./LivestockLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatDate } from "@/lib/utils";

export default function HeatGestation() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const utils = trpc.useUtils();

  const [heatDialogOpen, setHeatDialogOpen] = useState(false);
  const [pregnancyDialogOpen, setPregnancyDialogOpen] = useState(false);
  const [selectedBreeding, setSelectedBreeding] = useState<any>(null);

  // Heat log form
  const [heatForm, setHeatForm] = useState({
    animalId: "",
    observedDate: new Date().toISOString().slice(0, 10),
    observedTime: "06:00",
    heatSigns: "standing heat, clear mucus discharge",
    intensity: "moderate" as "weak" | "moderate" | "strong",
    status: "observed" as "observed" | "inseminated" | "expired" | "missed",
    notes: "",
  });

  // Pregnancy status update form
  const [pregnancyStatusForm, setPregnancyStatusForm] = useState({
    pregnancyStatus: "confirmed" as any,
    confirmedDate: new Date().toISOString().slice(0, 10),
    dryOffDate: "",
    notes: "",
  });

  const { data: animals = [] } = trpc.livestock.listAnimals.useQuery(
    { farmId, status: "active" },
    { enabled: !!farmId }
  );
  const femaleAnimals = animals.filter((a) => a.gender === "female");

  const { data: heatLogs = [], isLoading: loadingHeat } = trpc.livestock.listHeatLogs.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const { data: pregnancies = [], isLoading: loadingPregnancies } = trpc.livestock.listPregnancies.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const createHeat = trpc.livestock.createHeatLog.useMutation({
    onSuccess: () => {
      utils.livestock.listHeatLogs.invalidate();
      toast.success("Estrus observation recorded");
      setHeatDialogOpen(false);
      setHeatForm({
        animalId: "",
        observedDate: new Date().toISOString().slice(0, 10),
        observedTime: "06:00",
        heatSigns: "standing heat, clear mucus discharge",
        intensity: "moderate",
        status: "observed",
        notes: "",
      });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateHeat = trpc.livestock.updateHeatLog.useMutation({
    onSuccess: () => {
      utils.livestock.listHeatLogs.invalidate();
      toast.success("Heat log updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePregnancy = trpc.livestock.updateBreeding.useMutation({
    onSuccess: () => {
      utils.livestock.listPregnancies.invalidate();
      utils.livestock.listBreeding.invalidate();
      toast.success("Gestation status updated");
      setPregnancyDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleHeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heatForm.animalId) return toast.error("Please select an animal");

    // Standard AM-PM rule: Insemination window is 12-18 hours post heat detection
    const observedDt = new Date(`${heatForm.observedDate}T${heatForm.observedTime || "06:00"}:00`);
    const winStart = new Date(observedDt.getTime() + 10 * 60 * 60 * 1000);
    const winEnd = new Date(observedDt.getTime() + 20 * 60 * 60 * 1000);

    createHeat.mutate({
      farmId,
      animalId: parseInt(heatForm.animalId),
      observedDate: heatForm.observedDate,
      observedTime: heatForm.observedTime,
      heatSigns: heatForm.heatSigns,
      intensity: heatForm.intensity,
      breedingWindowStart: winStart.toISOString(),
      breedingWindowEnd: winEnd.toISOString(),
      status: heatForm.status,
      notes: heatForm.notes || undefined,
    });
  };

  const handleOpenPregnancyUpdate = (breeding: any) => {
    setSelectedBreeding(breeding);
    setPregnancyStatusForm({
      pregnancyStatus: breeding.pregnancyStatus || "confirmed",
      confirmedDate: breeding.confirmedDate ? String(breeding.confirmedDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      dryOffDate: breeding.dryOffDate ? String(breeding.dryOffDate).slice(0, 10) : "",
      notes: breeding.notes || "",
    });
    setPregnancyDialogOpen(true);
  };

  return (
    <LivestockLayout>
      <div className="space-y-8">
        {/* Section 1: Estrus & Heat Detection */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Estrus & Heat Detection</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Record estrus signs and track optimal artificial insemination (AI) windows (AM/PM rule)
              </p>
            </div>
            <Button onClick={() => setHeatDialogOpen(true)} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Log Heat Observation
            </Button>
          </div>

          {loadingHeat ? (
            <LoadingSkeleton />
          ) : heatLogs.length === 0 ? (
            <Card className="border border-dashed p-6 text-center text-muted-foreground text-sm">
              No heat observations recorded. Log standing heat or mounting behavior to track breeding windows.
            </Card>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground font-medium">
                    <tr>
                      <th className="text-left px-4 py-3">Animal</th>
                      <th className="text-left px-4 py-3">Observed Date / Time</th>
                      <th className="text-left px-4 py-3">Heat Signs</th>
                      <th className="text-left px-4 py-3">Intensity</th>
                      <th className="text-left px-4 py-3">Insemination Window</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {heatLogs.map((log: any) => {
                      const animal = animals.find((a) => a.id === log.animalId);
                      return (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            {animal?.name || animal?.tagNumber || `Animal #${log.animalId}`}
                            {animal?.breed && <span className="text-xs text-muted-foreground block">{animal.breed}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div>{formatDate(log.observedDate)}</div>
                            {log.observedTime && <span className="text-xs text-muted-foreground">{log.observedTime}</span>}
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate">{log.heatSigns}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={`capitalize text-xs ${
                                log.intensity === "strong"
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : log.intensity === "moderate"
                                  ? "border-orange-300 text-orange-700 bg-orange-50"
                                  : "border-gray-200 text-gray-700"
                              }`}
                            >
                              {log.intensity}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {log.breedingWindowStart ? (
                              <div className="flex items-center gap-1 text-primary">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(log.breedingWindowStart)}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="secondary"
                              className={`text-xs capitalize ${
                                log.status === "inseminated"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : log.status === "observed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {log.status === "observed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() =>
                                  updateHeat.mutate({
                                    heatLogId: log.id,
                                    farmId,
                                    status: "inseminated",
                                  })
                                }
                              >
                                Mark Inseminated
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Active Gestation & Dry-Off Tracker */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <div>
              <h2 className="text-lg font-semibold">Active Gestation & Calving Schedule</h2>
              <p className="text-xs text-muted-foreground">
                Track pregnancy confirmation, days to delivery, and mandatory dry-off timelines
              </p>
            </div>
          </div>

          {loadingPregnancies ? (
            <LoadingSkeleton />
          ) : pregnancies.length === 0 ? (
            <Card className="border border-dashed p-6 text-center text-muted-foreground text-sm">
              No active gestations or confirmed pregnancies in progress. Log breedings to track calving schedules.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pregnancies.map((p: any) => {
                const dam = animals.find((a) => a.id === p.damId);
                const now = new Date();
                const deliveryDt = p.expectedDeliveryDate ? new Date(p.expectedDeliveryDate) : null;
                const daysRemaining = deliveryDt
                  ? Math.ceil((deliveryDt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                const isImminent = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;
                const isOverdue = daysRemaining !== null && daysRemaining < 0;

                return (
                  <Card
                    key={p.id}
                    className={`border transition-all shadow-sm ${
                      isOverdue
                        ? "border-red-400 bg-red-50/20"
                        : isImminent
                        ? "border-amber-400 bg-amber-50/20"
                        : "border-border"
                    }`}
                  >
                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {dam?.name || dam?.tagNumber || `Dam #${p.damId}`}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          Bred: {formatDate(p.breedingDate)} • {p.breedingMethod}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`capitalize text-xs ${
                          p.pregnancyStatus === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.pregnancyStatus}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0 text-sm">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium">Expected Calving:</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold block text-xs">
                            {formatDate(p.expectedDeliveryDate)}
                          </span>
                          {daysRemaining !== null && (
                            <span
                              className={`text-xs font-medium ${
                                isOverdue
                                  ? "text-red-600 font-bold"
                                  : isImminent
                                  ? "text-amber-600 font-bold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {isOverdue ? `${Math.abs(daysRemaining)}d OVERDUE` : `${daysRemaining} days left`}
                            </span>
                          )}
                        </div>
                      </div>

                      {p.dryOffDate && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                          <span>Target Dry-Off Date:</span>
                          <span className="font-medium text-foreground">{formatDate(p.dryOffDate)}</span>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs w-full"
                          onClick={() => handleOpenPregnancyUpdate(p)}
                        >
                          Update Status / Outcome
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Dialog: Log Heat Observation */}
        <Dialog open={heatDialogOpen} onOpenChange={setHeatDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Estrus / Heat Detection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleHeatSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Female Animal *</Label>
                <Select
                  value={heatForm.animalId}
                  onValueChange={(val) => setHeatForm({ ...heatForm, animalId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select female animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {femaleAnimals.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name || a.tagNumber || `Animal #${a.id}`} {a.breed ? `(${a.breed})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Observed Date *</Label>
                  <Input
                    type="date"
                    value={heatForm.observedDate}
                    onChange={(e) => setHeatForm({ ...heatForm, observedDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Observed Time</Label>
                  <Input
                    type="time"
                    value={heatForm.observedTime}
                    onChange={(e) => setHeatForm({ ...heatForm, observedTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Heat Signs Observed *</Label>
                <Input
                  value={heatForm.heatSigns}
                  onChange={(e) => setHeatForm({ ...heatForm, heatSigns: e.target.value })}
                  placeholder="e.g., standing to be mounted, mucus discharge, restlessness"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Intensity</Label>
                  <Select
                    value={heatForm.intensity}
                    onValueChange={(val: any) => setHeatForm({ ...heatForm, intensity: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weak">Weak / Subtle</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="strong">Strong / Definite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Initial Status</Label>
                  <Select
                    value={heatForm.status}
                    onValueChange={(val: any) => setHeatForm({ ...heatForm, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="observed">Observed</SelectItem>
                      <SelectItem value="inseminated">Inseminated Already</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={heatForm.notes}
                  onChange={(e) => setHeatForm({ ...heatForm, notes: e.target.value })}
                  placeholder="Sire semen batch or inseminator notes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setHeatDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createHeat.isPending}>
                  Save Observation
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Update Pregnancy Status */}
        <Dialog open={pregnancyDialogOpen} onOpenChange={setPregnancyDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Gestation & Calving Status</DialogTitle>
            </DialogHeader>
            {selectedBreeding && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updatePregnancy.mutate({
                    breedingId: selectedBreeding.id,
                    farmId,
                    pregnancyStatus: pregnancyStatusForm.pregnancyStatus,
                    confirmedDate: pregnancyStatusForm.confirmedDate || undefined,
                    dryOffDate: pregnancyStatusForm.dryOffDate || undefined,
                    notes: pregnancyStatusForm.notes || undefined,
                  });
                }}
                className="space-y-4 pt-2"
              >
                <div className="space-y-1.5">
                  <Label>Pregnancy Status</Label>
                  <Select
                    value={pregnancyStatusForm.pregnancyStatus}
                    onValueChange={(val: any) =>
                      setPregnancyStatusForm({ ...pregnancyStatusForm, pregnancyStatus: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Verification</SelectItem>
                      <SelectItem value="confirmed">Confirmed Pregnant</SelectItem>
                      <SelectItem value="open">Open / Not Pregnant</SelectItem>
                      <SelectItem value="delivered">Delivered (Calved)</SelectItem>
                      <SelectItem value="failed">Failed / Aborted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Confirmation Date</Label>
                    <Input
                      type="date"
                      value={pregnancyStatusForm.confirmedDate}
                      onChange={(e) =>
                        setPregnancyStatusForm({ ...pregnancyStatusForm, confirmedDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dry-Off Date</Label>
                    <Input
                      type="date"
                      value={pregnancyStatusForm.dryOffDate}
                      onChange={(e) =>
                        setPregnancyStatusForm({ ...pregnancyStatusForm, dryOffDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Veterinary / Ultrasound Notes</Label>
                  <Textarea
                    value={pregnancyStatusForm.notes}
                    onChange={(e) =>
                      setPregnancyStatusForm({ ...pregnancyStatusForm, notes: e.target.value })
                    }
                    placeholder="Ultrasound confirmed single fetus, good heartbeat..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setPregnancyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updatePregnancy.isPending}>
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LivestockLayout>
  );
}
