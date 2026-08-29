import { Sparkles } from "lucide-react";
import { Link } from "wouter";

export function AiInsightWidget({ farmId }: { farmId: number }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-[17px] font-bold text-slate-900">AI Recommendations</h2>
        <Link href="/intelligence">
          <span className="text-[13px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer">View All ›</span>
        </Link>
      </div>

      <div className="bg-[#FFF9EA] rounded-2xl p-5 border border-amber-100 flex items-start gap-4 cursor-pointer hover:bg-amber-50/80 transition-colors">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[14px] text-amber-950 font-medium leading-snug flex-1">
          Consider applying top dressing fertilizer in your maize field in the next 7 days.
        </p>
        <span className="text-amber-700 text-lg leading-none ml-2">›</span>
      </div>
    </div>
  );
}
