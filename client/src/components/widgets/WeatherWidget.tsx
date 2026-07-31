import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun, Droplets, Wind, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFarm } from "@/contexts/FarmContext";
import { format, isValid } from "date-fns";

// ─── Compact Banner (header / system slot) ────────────────────────────────────

export function WeatherWidget({ farmId }: { farmId: number }) {
  const { data: weather, isLoading } = trpc.weather.getForFarm.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading || !weather) return null;

  return (
    <div className="flex items-center gap-5 px-5 py-2 bg-white rounded-full border shadow-sm">
      <div className="flex items-center gap-3">
        <CloudSun className="w-8 h-8 text-amber-500 fill-amber-100" />
        <div className="flex flex-col">
          <span className="text-[15px] font-bold leading-none">{weather.current.temperature}°C</span>
          <span className="text-[11px] font-medium text-muted-foreground leading-tight mt-0.5">Farm Location</span>
        </div>
      </div>
      
      <div className="w-px h-8 bg-border"></div>
      
      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-blue-500 fill-blue-100" />
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-muted-foreground leading-none">Humidity</span>
          <span className="text-xs font-bold leading-tight mt-0.5">{weather.current.humidity}%</span>
        </div>
      </div>

      <div className="w-px h-8 bg-border"></div>
      
      <div className="flex items-center gap-2">
        <Wind className="w-4 h-4 text-cyan-500 fill-cyan-100" />
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-muted-foreground leading-none">Wind</span>
          <span className="text-xs font-bold leading-tight mt-0.5">{weather.current.windSpeed} km/h<br/>{weather.current.windDirection || "ESE"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Weather Alerts Widget (summary slot) ─────────────────────────────────────

export function WeatherAlertsWidget({ farmId }: { farmId: number }) {
  const { data: weather, isLoading } = trpc.weather.getForFarm.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) return null;
  if (!weather || weather.alerts.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50/50 shadow-sm col-span-full">
      <CardHeader className="pb-3 border-b border-red-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <CardTitle className="text-sm font-semibold text-red-900">Active Weather Alerts</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-red-100">
          {weather.alerts.map((alert, idx) => (
            <div key={idx} className="p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-red-800 text-sm">{alert.title}</span>
                <span className="text-xs text-red-600/70 font-medium">
                  {alert.startsAt && isValid(new Date(alert.startsAt))
                    ? format(new Date(alert.startsAt), "MMM d, h:mm a")
                    : "Active Alert"}
                </span>
              </div>
              <p className="text-xs text-red-700/90 leading-relaxed">
                {alert.description}
              </p>
              {alert.recommendation && (
                <div className="mt-2 bg-white/60 px-3 py-2 rounded-md border border-red-100">
                  <span className="text-[10px] uppercase font-bold text-red-800 tracking-wider">Recommended Action</span>
                  <p className="text-xs text-red-900 mt-0.5">{alert.recommendation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
