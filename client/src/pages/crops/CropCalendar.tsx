import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import CropsLayout from "./CropsLayout";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function CropCalendar() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: plantings = [], isLoading } = trpc.crops.listPlantings.useQuery({ farmId }, { enabled: !!farmId });

  const calendarData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const monthStr = `${year}-${String(idx + 1).padStart(2, "0")}`;
      const planted = plantings.filter((p) => String(p.plantingDate).startsWith(monthStr));
      const harvested = plantings.filter((p) => p.expectedHarvestDate && String(p.expectedHarvestDate).startsWith(monthStr));
      return { month, planted, harvested };
    });
  }, [plantings, year]);

  return (
    <CropsLayout>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setYear(y => y - 1)} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent">‹</button>
          <span className="font-semibold text-lg">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent">›</button>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 inline-block" />Planted</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 inline-block" />Expected Harvest</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {calendarData.map(({ month, planted, harvested }) => {
            const isCurrentMonth = new Date().getMonth() === MONTHS.indexOf(month) && new Date().getFullYear() === year;
            return (
              <Card key={month} className={cn("border-0 shadow-sm", isCurrentMonth && "ring-2 ring-primary")}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className={cn("text-sm font-semibold", isCurrentMonth ? "text-primary" : "text-foreground")}>{month}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {planted.length > 0 && (
                    <div>
                      <p className="text-xs text-green-700 font-medium mb-1">Planted ({planted.length})</p>
                      {planted.slice(0, 3).map((p) => (
                        <p key={p.id} className="text-xs text-muted-foreground truncate">{p.cropName}</p>
                      ))}
                      {planted.length > 3 && <p className="text-xs text-muted-foreground">+{planted.length - 3} more</p>}
                    </div>
                  )}
                  {harvested.length > 0 && (
                    <div>
                      <p className="text-xs text-amber-700 font-medium mb-1">Harvest ({harvested.length})</p>
                      {harvested.slice(0, 3).map((p) => (
                        <p key={p.id} className="text-xs text-muted-foreground truncate">{p.cropName}</p>
                      ))}
                    </div>
                  )}
                  {planted.length === 0 && harvested.length === 0 && (
                    <p className="text-xs text-muted-foreground/50">No activity</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </CropsLayout>
  );
}
