import { Link } from "wouter";
import { Cpu, Wifi, WifiOff, AlertTriangle, Activity, Droplets, Thermometer, Wind, Gauge, Settings2, PlusCircle, CheckCircle2 } from "lucide-react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";

// ─── Sensor config (drives live readings — do not change) ────────────────────
const HIGHLIGHTED_SENSORS = [
  { type: "soil_moisture",         label: "Soil Moisture",   unit: "%",  icon: Droplets,    color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
  { type: "air_temperature",       label: "Air Temperature", unit: "°C", icon: Thermometer, color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100" },
  { type: "humidity",              label: "Humidity",        unit: "%",  icon: Wind,        color: "text-primary",     bg: "bg-primary/5",  border: "border-primary/10" },
  { type: "tank_level",            label: "Tank Level",      unit: "%",  icon: Gauge,       color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100" },
  { type: "livestock_temperature", label: "Livestock Temp",  unit: "°C", icon: Thermometer, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
];

export default function IoTDashboard() {
  const { currentFarm } = useFarm();

  // ── All existing queries untouched ───────────────────────────────────────
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

  const hasDevices = (summary?.devices.length ?? 0) > 0;

  // ── Empty state: no devices registered ───────────────────────────────────
  if (!isLoading && !hasDevices) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-6 sm:px-6 space-y-6">
        <PageHeader
          title="IoT Sensors"
          description="Smart farm monitoring and automation"
          icon={Cpu}
        >
          <Button asChild variant="outline" className="gap-2 text-muted-foreground text-sm">
            <Link href="/iot/rules">
              <Settings2 className="w-4 h-4" /> Rules Engine
            </Link>
          </Button>
        </PageHeader>

        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border bg-card">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Cpu className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-serif text-foreground mb-2">No Devices Yet</h2>
          <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
            Register your first IoT sensor to start monitoring soil moisture, temperature, tank levels, and more in real time.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-full px-6">
            <Link href="/iot/devices">
              <PlusCircle className="w-4 h-4" /> Add Your First Device
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Main dashboard: devices exist ─────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-6 sm:px-6 space-y-6">
      <PageHeader
        title="IoT Sensors"
        description="Live sensor data from your farm"
        icon={Cpu}
      >
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2 text-muted-foreground text-sm">
            <Link href="/iot/rules">
              <Settings2 className="w-4 h-4" /> Rules
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-full">
            <Link href="/iot/devices">
              <PlusCircle className="w-4 h-4" /> Add Device
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Devices</p>
          <p className="text-3xl font-bold text-foreground">{summary?.devices.length ?? "—"}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" /> Online
          </p>
          <p className="text-3xl font-bold text-emerald-600">{summary?.onlineCount ?? "—"}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-muted-foreground" /> Offline
          </p>
          <p className="text-3xl font-bold text-muted-foreground">{summary?.offlineCount ?? "—"}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> Active Alerts
          </p>
          <p className="text-3xl font-bold text-orange-500">{alerts.length}</p>
        </div>
      </div>

      {/* Sensor Bento Cards */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Live Sensor Readings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {HIGHLIGHTED_SENSORS.map(sensor => {
            const Icon = sensor.icon;
            const reading = summary?.latestReadings?.[sensor.type];
            return (
              <div
                key={sensor.type}
                className={`${sensor.bg} ${sensor.border} border rounded-2xl p-5 flex flex-col gap-3 shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
                    <Icon className={`w-5 h-5 ${sensor.color}`} />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${reading ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{sensor.label}</p>
                  {reading ? (
                    <p className={`text-2xl font-bold mt-0.5 ${sensor.color}`}>
                      {reading.value}
                      <span className="text-sm font-normal ml-1 opacity-70">{reading.unit}</span>
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-muted-foreground/30 mt-0.5">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Devices & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Connected Devices */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold font-serif text-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> Connected Devices
            </h3>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {summary?.devices.length ?? 0} total
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading devices…</div>
            ) : (
              summary?.devices.map(device => (
                <div key={device.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{device.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{device.deviceType.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.batteryLevel != null && (
                      <span className="text-xs text-muted-foreground">{device.batteryLevel}%</span>
                    )}
                    <Badge
                      variant="outline"
                      className={device.status === "online"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                        : "bg-muted text-muted-foreground border-border text-xs"}
                    >
                      {device.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold font-serif text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Active Alerts
            </h3>
            {alerts.length > 0 && (
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-xs">
                {alerts.length} active
              </Badge>
            )}
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-emerald-700 font-semibold text-sm">All systems normal</p>
                <p className="text-xs text-muted-foreground">No active threshold alerts.</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-muted/40 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => markRead.mutate({ alertId: alert.id })}
                    className="text-xs text-muted-foreground hover:text-foreground shrink-0"
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
