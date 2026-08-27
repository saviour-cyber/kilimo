import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Cpu, PlusCircle, Wifi, WifiOff, Battery,
  MapPin, RefreshCw, Thermometer, Droplets, Wind, Gauge, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import RegisterDeviceModal from "./RegisterDeviceModal";

const DEVICE_TYPE_LABELS: Record<string, string> = {
  weather_station:  "ðŸŒ¦ï¸ Weather Station",
  soil_probe:       "ðŸŒ± Soil Probe",
  water_sensor:     "ðŸ’§ Water Sensor",
  livestock_collar: "ðŸ„ Livestock Collar",
  equipment_sensor: "ðŸšœ Equipment Sensor",
  gateway:          "ðŸ”— Gateway",
  other:            "ðŸ“¡ Other",
};

export default function IoTDeviceManager() {
  const { currentFarm } = useFarm();
  const [showRegister, setShowRegister] = useState(false);
  const [expandedDevice, setExpandedDevice] = useState<number | null>(null);

  const { data: devices = [], isLoading, refetch } = trpc.iot.getDevices.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id }
  );

  const { data: allSensors = [] } = trpc.iot.getFarmSensors.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id }
  );

  const { data: latestTelemetry = [] } = trpc.iot.getLatestTelemetry.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id, refetchInterval: 30000 }
  );

  if (!currentFarm) return null;

  const getSensorsForDevice = (deviceId: number) =>
    allSensors.filter(s => s.deviceId === deviceId);

  const getLatestValueForSensor = (sensorId: number) =>
    latestTelemetry.find(t => t.sensorId === sensorId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/iot"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-500" /> Device Manager
          </h1>
          <p className="text-sm text-muted-foreground">Register and monitor all connected IoT devices</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="icon" className="shrink-0">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => setShowRegister(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Register Device
        </Button>
      </div>

      {/* Device List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-12 text-center text-muted-foreground">
            Loading devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-16 text-center flex flex-col items-center gap-4">
            <Cpu className="w-12 h-12 text-slate-200" />
            <div>
              <p className="font-medium text-muted-foreground">No devices registered yet</p>
              <p className="text-sm text-muted-foreground mt-1">Register your first simulated device to start generating telemetry</p>
            </div>
            <Button onClick={() => setShowRegister(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
              <PlusCircle className="w-4 h-4" /> Register Device
            </Button>
          </div>
        ) : (
          devices.map(device => {
            const sensors = getSensorsForDevice(device.id);
            const isExpanded = expandedDevice === device.id;

            return (
              <div key={device.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Device Header Row */}
                <button
                  onClick={() => setExpandedDevice(isExpanded ? null : device.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                      ${device.status === "online" ? "bg-emerald-50" : "bg-muted"}`}>
                      {DEVICE_TYPE_LABELS[device.deviceType]?.split(" ")[0] ?? "ðŸ“¡"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{device.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{DEVICE_TYPE_LABELS[device.deviceType]?.split(" ").slice(1).join(" ")}</span>
                        {device.manufacturer && <><span>â€¢</span><span>{device.manufacturer}</span></>}
                        {device.model && <><span>â€¢</span><span>{device.model}</span></>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {device.batteryLevel != null && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Battery className="w-3.5 h-3.5" />
                        {device.batteryLevel}%
                      </div>
                    )}
                    {device.lastCommunicationAt && (
                      <span className="text-xs text-muted-foreground hidden md:block">
                        {formatDistanceToNow(new Date(device.lastCommunicationAt), { addSuffix: true })}
                      </span>
                    )}
                    <Badge className={
                      device.status === "online"
                        ? "bg-emerald-100 text-emerald-700 border-0"
                        : "bg-muted text-muted-foreground border-0"
                    }>
                      {device.status === "online"
                        ? <><Wifi className="w-3 h-3 mr-1" />Online</>
                        : <><WifiOff className="w-3 h-3 mr-1" />Offline</>
                      }
                    </Badge>
                    <span className="text-slate-300 text-sm">{isExpanded ? "â–²" : "â–¼"}</span>
                  </div>
                </button>

                {/* Expanded: Sensor Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-50 px-6 py-5">
                    <div className="flex items-center gap-2 mb-4">
                      {!!device.location && typeof device.location === "object" ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {(device.location as any).label ?? "GPS Location"}
                        </span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">Protocol: <strong>{device.protocol}</strong></span>
                      {device.firmwareVersion && (
                        <span className="text-xs text-muted-foreground">FW: <strong>{device.firmwareVersion}</strong></span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Sensors ({sensors.length})
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {sensors.map(sensor => {
                        const reading = getLatestValueForSensor(sensor.id);
                        return (
                          <div key={sensor.id} className="bg-muted rounded-xl p-3">
                            <p className="text-xs font-medium text-muted-foreground capitalize">
                              {sensor.label ?? sensor.sensorType.replace(/_/g, " ")}
                            </p>
                            <div className="flex items-baseline gap-1 mt-1">
                              {reading && reading.value != null ? (
                                <>
                                  <span className="text-lg font-bold text-foreground">{reading.value.toFixed(1)}</span>
                                  <span className="text-xs text-muted-foreground">{sensor.unit}</span>
                                </>
                              ) : (
                                <span className="text-sm text-slate-300">No data yet</span>
                              )}
                            </div>
                            <div className="flex gap-1 mt-1">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                                ${sensor.category === "soil" ? "bg-amber-100 text-amber-700" :
                                  sensor.category === "environmental" ? "bg-sky-100 text-sky-700" :
                                  sensor.category === "water" ? "bg-blue-100 text-blue-700" :
                                  sensor.category === "livestock" ? "bg-emerald-100 text-emerald-700" :
                                  "bg-muted text-muted-foreground"}`}>
                                {sensor.category}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showRegister && (
        <RegisterDeviceModal
          farmId={currentFarm.farm.id}
          onClose={() => setShowRegister(false)}
          onSuccess={() => { setShowRegister(false); refetch(); toast.success("Device registered!"); }}
        />
      )}
    </div>
  );
}
