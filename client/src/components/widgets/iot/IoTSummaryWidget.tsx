/**
 * IoT Summary Widget Ã¢â‚¬â€ for the main farm Dashboard
 *
 * Shows key live readings (soil moisture, air temp, tank level) and device status.
 * Refreshes every 30 seconds via the iot.getFarmIoTSummary query.
 * Consumers must NOT import from SimulatedProvider or DeviceRegistry directly.
 */

import { Link } from "wouter";
import { Cpu, Droplets, Thermometer, Gauge, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Props {
  farmId: number;
}

const KEY_READINGS = [
  { type: "soil_moisture",   label: "Soil",      icon: Droplets,    color: "text-amber-600",  bg: "bg-amber-50" },
  { type: "air_temperature", label: "Air Temp",  icon: Thermometer, color: "text-sky-600",    bg: "bg-sky-50" },
  { type: "tank_level",      label: "Tank",      icon: Gauge,       color: "text-blue-600",   bg: "bg-blue-50" },
];

export default function IoTSummaryWidget({ farmId }: Props) {
  const { data: summary, isLoading } = trpc.iot.getFarmIoTSummary.useQuery(
    { farmId },
    { enabled: !!farmId, refetchInterval: 30000 }
  );

  const { data: alerts = [] } = trpc.iot.getAlerts.useQuery(
    { farmId, unreadOnly: true },
    { enabled: !!farmId, refetchInterval: 30000 }
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!summary || summary.devices.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-500" />
          <h3 className="font-bold text-[15px] font-serif text-foreground">IoT Sensors</h3>
        </div>
        <div className="flex items-center gap-3">
          {alerts.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
              <AlertTriangle className="w-3 h-3" /> {alerts.length}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {summary.onlineCount > 0
              ? <><Wifi className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600 font-medium">{summary.onlineCount} online</span></>
              : <><WifiOff className="w-3 h-3" /><span>{summary.offlineCount} offline</span></>
            }
          </div>
          <Link href="/iot" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
            View all Ã¢â€ â€™
          </Link>
        </div>
      </div>

      {/* Key Readings */}
      <div className="p-4 grid grid-cols-3 gap-3">
        {KEY_READINGS.map(reading => {
          const Icon = reading.icon;
          const data = summary.latestReadings?.[reading.type];
          return (
            <div key={reading.type} className={`${reading.bg} rounded-xl p-3 text-center`}>
              <Icon className={`w-4 h-4 ${reading.color} mx-auto mb-1`} />
              <p className="text-xs text-muted-foreground mb-0.5">{reading.label}</p>
              {data ? (
                <p className={`text-base font-bold ${reading.color}`}>
                  {data.value.toFixed(1)}<span className="text-[10px] font-normal ml-0.5">{data.unit}</span>
                </p>
              ) : (
                <p className="text-base font-bold text-slate-200">Ã¢â‚¬â€</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Device status bar */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {summary.devices.slice(0, 5).map(device => (
          <span
            key={device.id}
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full
              ${device.status === "online" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
          >
            {device.name.split(" ").slice(0, 2).join(" ")}
          </span>
        ))}
        {summary.devices.length > 5 && (
          <span className="text-[10px] text-muted-foreground">+{summary.devices.length - 5} more</span>
        )}
      </div>
    </div>
  );
}
