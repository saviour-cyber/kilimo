import { Brain, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export function AiInsightWidget({ farmId }: { farmId: number }) {
  const { data: insights, isLoading } = trpc.intelligence.getRecommendations.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  if (isLoading) {
    return <Skeleton className="h-[88px] w-full rounded-2xl" />;
  }

  const recommendation = insights?.recommendations?.[0];

  if (!recommendation) return null;

  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-base font-semibold text-foreground">Recommendations</h2>
        <Link href="/intelligence">
          <span className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">View All ›</span>
        </Link>
      </div>

      <div className="bg-transparent rounded-2xl p-4 border shadow-sm flex items-start gap-4 cursor-pointer hover:bg-muted/30 transition-colors">
        <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-[14px] text-foreground font-medium leading-snug flex-1">
          {recommendation.replace(/[⭐❓✨🎉✅]/g, '').trim()}
        </p>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}
