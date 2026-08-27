import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const DEVICE_TYPES = [
  { value: "weather_station",  label: "ðŸŒ¦ï¸ Weather Station" },
  { value: "soil_probe",       label: "ðŸŒ± Soil Probe" },
  { value: "water_sensor",     label: "ðŸ’§ Water / Tank Sensor" },
  { value: "livestock_collar", label: "ðŸ„ Livestock Collar" },
  { value: "equipment_sensor", label: "ðŸšœ Equipment Sensor" },
  { value: "gateway",          label: "ðŸ”— Gateway" },
  { value: "other",            label: "ðŸ“¡ Other" },
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Register New Device</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Device Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Device Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Field A Weather Station"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Device Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Device Type *</label>
            <select
              value={deviceType}
              onChange={e => setDeviceType(e.target.value as any)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
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
              <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                placeholder="e.g. Davis"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Model</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. Vantage Pro"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Location Label */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Location / Zone Label</label>
            <input
              type="text"
              value={locationLabel}
              onChange={e => setLocationLabel(e.target.value)}
              placeholder="e.g. Field A, Main Tank, Grazing Area"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Simulated notice */}
          <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-xs text-cyan-700">
            <strong>Phase 1 â€” Simulated Mode:</strong> This device will generate realistic sensor data automatically every 30 seconds. Real hardware can be connected in Phase 2.
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {registerMutation.isPending ? "Registering..." : "Register Device"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
