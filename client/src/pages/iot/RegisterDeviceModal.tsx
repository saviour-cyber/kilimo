import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const DEVICE_TYPES = [
  { value: "weather_station",  label: "Weather Station" },
  { value: "soil_probe",       label: "Soil Probe" },
  { value: "water_sensor",     label: "Water / Tank Sensor" },
  { value: "livestock_collar", label: "Livestock Collar" },
  { value: "equipment_sensor", label: "Equipment Sensor" },
  { value: "gateway",          label: "Gateway" },
  { value: "other",            label: "Other" },
] as const;

interface Props {
  farmId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterDeviceModal({ farmId, onClose, onSuccess }: Props) {
  const [name, setName]             = useState("");
  const [deviceType, setDeviceType] = useState<typeof DEVICE_TYPES[number]["value"]>("weather_station");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel]           = useState("");
  const [locationLabel, setLocationLabel] = useState("");

  const registerMutation = trpc.iot.registerDevice.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Device name is required"); return; }

    try {
      await registerMutation.mutateAsync({
        farmId,
        name: name.trim(),
        deviceType,
        protocol: "simulated",
        manufacturer: manufacturer || undefined,
        model: model || undefined,
        isSimulated: true,
        location: locationLabel ? { lat: 0, lng: 0, label: locationLabel } : undefined,
      });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to register device");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold font-serif text-foreground">Register New Device</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Device Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Device Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Field A Weather Station"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Device Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Device Type *</label>
            <select
              value={deviceType}
              onChange={e => setDeviceType(e.target.value as any)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
            >
              {DEVICE_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Sensors will be auto-created based on device type.</p>
          </div>

          {/* Manufacturer & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                placeholder="e.g. Davis"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Model</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. Vantage Pro"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Location Label */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Location / Zone Label</label>
            <input
              type="text"
              value={locationLabel}
              onChange={e => setLocationLabel(e.target.value)}
              placeholder="e.g. Field A, Main Tank, Grazing Area"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            >
              {registerMutation.isPending ? "Registering..." : "Register Device"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
