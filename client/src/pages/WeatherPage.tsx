import { CloudRain, Droplets, Thermometer, Wind, AlertTriangle, CloudSun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";

export default function WeatherPage() {
  const { currentFarm } = useFarm();
  
  const { data: weatherData, isLoading, error } = trpc.weather.getForFarm.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id }
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="max-w-[1600px] mx-auto w-full px-4 pt-4 sm:px-6 sm:pt-6">
        <PageHeader 
          title="Weather Engine" 
          description="Platform Services Workspace"
          icon={CloudRain}
          iconColor="text-blue-700"
          iconBg="bg-blue-100"
        />
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
        {!currentFarm ? (
          <Card className="border shadow-sm bg-white">
            <CardContent className="p-12 text-center text-slate-500">
              <p>Please select a farm to view weather data.</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error || !weatherData ? (
          <Card className="border shadow-sm bg-white">
            <CardContent className="p-12 text-center text-red-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h2 className="text-lg font-semibold mb-2">Error Loading Weather</h2>
              <p className="text-sm">{error?.message || "Failed to fetch weather data."}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Current Conditions */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <CloudSun className="w-24 h-24 text-blue-100" />
                  <div>
                    <h2 className="text-4xl font-bold mb-2">{weatherData.current.temperature}°C</h2>
                    <p className="text-xl text-blue-100 capitalize">{weatherData.current.description}</p>
                    <p className="text-sm text-blue-200 mt-1">Location: {currentFarm.farm.location || "Nairobi, Kenya"}</p>
                  </div>
                </div>
                
                <div className="flex gap-8 text-blue-100 bg-black/10 p-6 rounded-2xl">
                  <div className="flex flex-col items-center">
                    <Droplets className="w-6 h-6 mb-2" />
                    <span className="text-sm">Humidity</span>
                    <span className="font-semibold">{weatherData.current.humidity}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Wind className="w-6 h-6 mb-2" />
                    <span className="text-sm">Wind</span>
                    <span className="font-semibold">{weatherData.current.windSpeed} km/h</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CloudRain className="w-6 h-6 mb-2" />
                    <span className="text-sm">Precipitation</span>
                    <span className="font-semibold">{weatherData.current.precipitation || 0} mm</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            {weatherData.alerts.length > 0 && (
              <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Weather Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weatherData.alerts.map((alert, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 flex items-start gap-4 shadow-sm">
                        <AlertTriangle className={cn("w-6 h-6 shrink-0 mt-1", 
                          alert.severity === "critical" ? "text-red-600" : 
                          alert.severity === "high" ? "text-orange-500" : "text-yellow-500"
                        )} />
                        <div>
                          <h4 className="font-semibold text-slate-800">{alert.title || alert.type}</h4>
                          <p className="text-slate-600 text-sm mt-1">{alert.message} {alert.description}</p>
                          {alert.recommendation && (
                            <p className="text-slate-700 text-sm mt-2 font-medium bg-slate-50 p-2 rounded-md">
                              💡 Recommendation: {alert.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Agricultural Insights */}
            {weatherData.insights && (
              <Card className="col-span-1 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800 text-lg">Agricultural Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500">Spraying Conditions</span>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", 
                      weatherData.insights.sprayingConditions === "optimal" ? "bg-green-100 text-green-700" :
                      weatherData.insights.sprayingConditions === "marginal" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {weatherData.insights.sprayingConditions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500">Irrigation Need</span>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize",
                      weatherData.insights.irrigationNeed === "none" ? "bg-slate-100 text-slate-700" :
                      weatherData.insights.irrigationNeed === "moderate" ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {weatherData.insights.irrigationNeed}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500">Frost Risk</span>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium",
                      weatherData.insights.frostRisk ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    )}>
                      {weatherData.insights.frostRisk ? "High Risk" : "Low Risk"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500">Heat Stress Risk</span>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium",
                      weatherData.insights.heatStressRisk ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    )}>
                      {weatherData.insights.heatStressRisk ? "High Risk" : "Low Risk"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Forecast */}
            <Card className="col-span-1 md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 text-lg">7-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                  {weatherData.forecast.map((day, idx) => {
                    const date = new Date(day.date);
                    return (
                      <div key={idx} className="flex flex-col items-center bg-slate-50 p-3 rounded-xl">
                        <span className="text-sm font-medium text-slate-700">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-xs text-slate-500 mb-2">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <CloudSun className="w-8 h-8 text-slate-400 mb-2" />
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <span className="text-slate-800">{Math.round(day.maxTemp)}°</span>
                          <span className="text-slate-400">{Math.round(day.minTemp)}°</span>
                        </div>
                        {day.precipitationProbability > 0 && (
                          <span className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                            <Droplets className="w-3 h-3" /> {day.precipitationProbability}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
}
