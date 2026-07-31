import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import CropsLayout from "./CropsLayout";

export default function CropAnalytics() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const { data: plantings = [] } = trpc.crops.listPlantings.useQuery({ farmId }, { enabled: !!farmId });
  const { data: harvests = [], isLoading } = trpc.crops.listHarvests.useQuery({ farmId }, { enabled: !!farmId });

  const byMonth: Record<string, number> = {};
  for (const h of harvests) {
    if (h.harvestDate) {
      const month = String(h.harvestDate).slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + (parseFloat(String(h.yieldAmount)) || 0);
    }
  }
  const yieldData = Object.entries(byMonth)
    .map(([month, totalYield]) => ({ month, totalYield }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalYield = harvests.reduce((s, h) => s + (parseFloat(String(h.yieldAmount)) || 0), 0);
  const avgYield = harvests.length > 0 ? totalYield / harvests.length : 0;

  // Crop distribution
  const cropDist: Record<string, number> = {};
  for (const p of plantings) {
    cropDist[p.cropName] = (cropDist[p.cropName] ?? 0) + 1;
  }
  const cropDistData = Object.entries(cropDist).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  return (
    <CropsLayout>
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Harvests</p>
            <p className="text-3xl font-bold mt-1">{harvests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Yield</p>
            <p className="text-3xl font-bold mt-1">{totalYield.toFixed(0)} kg</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg per Harvest</p>
            <p className="text-3xl font-bold mt-1">{avgYield.toFixed(0)} kg</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Yield Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : yieldData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No harvest data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={yieldData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="totalYield" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} name="Yield (kg)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Crop Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {cropDistData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No planting data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cropDistData.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} name="Plantings" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </CropsLayout>
  );
}
