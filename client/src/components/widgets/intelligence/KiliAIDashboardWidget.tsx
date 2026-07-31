import { Card, CardContent } from "@/components/ui/card";
import { Brain, CloudRain, Syringe, Package, Sprout, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ICONS = [CloudRain, Syringe, Package, Sprout, Sparkles];
const BADGE_STYLES = [
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-red-100 text-red-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
];

export function KiliAIDashboardWidget({ farmId, className }: { farmId: number; className?: string }) {
  const { data, isLoading } = trpc.intelligence.getRecommendations.useQuery(
    { farmId },
    { enabled: !!farmId, refetchOnWindowFocus: false }
  );

  if (isLoading) return <Skeleton className={cn("h-[150px] rounded-xl w-full", className)} />;

  const recommendations: string[] = data?.recommendations ?? [];
  const summary = data?.summary ?? "Your farm's AI assistant is ready to help.";

  return (
    <Card className={cn("border shadow-sm bg-white w-full", className)}>
      <div className="p-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-green-700" />
            </div>
            <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-sm leading-none">AI</span>
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-slate-900">Kili AI Insights</h3>
            <p className="text-xs text-slate-500 mt-0.5">{summary}</p>
          </div>
        </div>
        <Link href="/kili-ai">
          <button className="text-[12px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1 whitespace-nowrap">
            View All Recommendations <ArrowRight className="w-3 h-3" />
          </button>
        </Link>
      </div>
      <CardContent className="p-3">
        {recommendations.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            No recommendations yet. Start adding data to see AI insights.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {recommendations.slice(0, 4).map((rec, i) => {
              const Icon = ICONS[i % ICONS.length];
              const badge = BADGE_STYLES[i % BADGE_STYLES.length];
              return (
                <div key={i} className="border border-slate-100 rounded-lg p-3 flex gap-3 items-start bg-slate-50/50 hover:bg-slate-50 cursor-pointer group">
                  <div className="bg-white p-1.5 rounded-md border border-slate-100 shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <p className="text-xs font-semibold text-slate-700 leading-snug">{rec}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded self-start ${badge}`}>
                      Insight
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
