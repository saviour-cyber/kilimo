import { Link } from "wouter";
import { Cpu, Wifi, WifiOff, AlertTriangle, Activity, Droplets, Thermometer, Wind, Gauge, Settings2 } from "lucide-react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  soil:          Droplets,
  environmental: Wind,
  water:         Gauge,
  livestock:     Activity,
  equipment:     Cpu,
};

const CATEGORY_COLORS: Record<string, string> = {
  soil:          "text-amber-600 bg-amber-50",
  environmental: "text-sky-600 bg-sky-50",
  water:         "text-blue-600 bg-blue-50",
  livestock:     "text-emerald-600 bg-emerald-50",
  equipment:     "text-muted-foreground bg-muted",
};

const HIGHLIGHTED_SENSORS = [
  { type: "soil_moisture",          label: "Soil Moisture",       unit: "%",   icon: Droplets,    color: "text-amber-600", bg: "bg-amber-50" },
  { type: "air_temperature",        label: "Air Temperature",     unit: "Â°C",  icon: Thermometer, color: "text-sky-600",   bg: "bg-sky-50" },
  { type: "humidity",               label: "Humidity",            unit: "%",   icon: Wind,        color: "text-blue-600",  bg: "bg-blue-50" },
  { type: "tank_level",             label: "Tank Level",          unit: "%",   icon: Gauge,       color: "text-indigo-600",bg: "bg-indigo-50" },
  { type: "livestock_temperature",  label: "Livestock Temp",      unit: "Â°C",  icon: Thermometer, color: "text-emerald-600",bg: "bg-emerald-50" },
];

export default function IoTDashboard() {
  const { currentFarm } = useFarm();

  const { data: summary, isLoading } = trpc.iot.getFarmIoTSummary.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id, refetchInterval: 30000 }
  );

  const { data: alerts = [] } = trpc.iot.getAlerts.useQuery(
    { farmId: currentFarm?.farm.id ?? 0, unreadOnly: true },
    { enabled: !!currentFarm?.farm.id, refetchInterval: 30000 }
  );

  const utils = trpc.useUtils();
  const markRead = trpc.iot.markAlertRead.useMutation({
    onSuccess: () => utils.iot.getAlerts.invalidate()
  });

  if (!currentFarm) return null;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 space-y-6">
      <PageHeader 
        title="IoT Operations Center" 
        description="Monitor sensor fleets and automate responses"
        icon={Cpu}
        iconColor="text-cyan-600"
        iconBg="bg-cyan-100"
      >
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2 text-indigo-600 hover:text-indigo-700">
            <Link href="/iot/rules">
              <Settings2 className="w-4 h-4" /> Rules Engine
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/iot/devices">
              <Cpu className="w-4 h-4" /> Manage Devices
            </Link>
          </Button>
        </div>
      </PageHeader>
      {/* Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Devices</p>
          <p className="text-3xl font-bold text-foreground mt-1">{summary?.devices.length ?? "â€”"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Wifi className="w-3 h-3 text-emerald-500" /> Online
          </p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{summary?.onlineCount ?? "â€”"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <WifiOff className="w-3 h-3 text-muted-foreground" /> Offline
          </p>
          <p className="text-3xl font-bold text-muted-foreground mt-1">{summary?.offlineCount ?? "â€”"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-500" /> Active Alerts
          </p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{alerts.length}</p>
        </div>
      </div>

      {/* Highlighted Sensor Readings */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key Sensor Readings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {HIGHLIGHTED_SENSORS.map(sensor => {
            const Icon = sensor.icon;
            const reading = summary?.latestReadings?.[sensor.type];
            return (
              <div key={sensor.type} className={`${sensor.bg} rounded-2xl p-4 flex flex-col gap-2`}>
                <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${sensor.color}`} />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{sensor.label}</p>
                {reading ? (
                  <p className={`text-2xl font-bold ${sensor.color}`}>
                    {reading.value}<span className="text-sm font-normal ml-1">{reading.unit}</span>
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-slate-300">â€”</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Device List & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Device List */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-500" /> Connected Devices
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading devices...</div>
            ) : !summary?.devices.length ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No devices registered.</p>
                <Link href="/iot/devices" className="text-cyan-600 text-sm hover:underline mt-2 inline-block">
                  Register your first device
                </Link>
              </div>
            ) : (
              summary.devices.map(device => (
                <div key={device.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{device.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{device.deviceType.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.batteryLevel != null && (
                      <span className="text-xs text-muted-foreground">{device.batteryLevel}%</span>
                    )}
                    <Badge variant={device.status === "online" ? "default" : "secondary"}
                      className={device.status === "online" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-muted text-muted-foreground border-0"}>
                      {device.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Active Alerts
            </h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-emerald-600 font-medium">âœ“ All systems normal</p>
                <p className="text-xs mt-1">No active threshold alerts.</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => markRead.mutate({ alertId: alert.id })}
                    className="text-xs text-muted-foreground hover:text-muted-foreground shrink-0"
                  >
                    Dismiss
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
