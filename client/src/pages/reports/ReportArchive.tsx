import { Link } from "wouter";
import { Archive, ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function ReportArchive() {
  const { currentFarm } = useFarm();
  
  const { data: reports = [], isLoading } = trpc.reports.getGeneratedReports.useQuery(
    { farmId: currentFarm?.farm.id ?? 0, limit: 100 },
    { enabled: !!currentFarm?.farm.id }
  );

  if (!currentFarm) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-500" />
            Report Archive
          </h1>
          <p className="text-sm text-muted-foreground">History of all generated reports</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading archive...</div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-muted-foreground font-medium">No reports found.</p>
            <p className="text-sm text-muted-foreground mt-1">Generated reports will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map(report => (
              <div key={report.id} className="p-5 flex items-center justify-between hover:bg-muted transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-1">
                    <FileText className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{report.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
                      <span className="uppercase tracking-wider px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                        {report.format}
                      </span>
                      <span>{format(new Date(report.generatedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      {!!report.moduleKeys && Array.isArray(report.moduleKeys) ? (
                        <span>â€¢ Modules: {(report.moduleKeys as string[]).join(', ')}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {report.fileUrl && (
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <a href={report.fileUrl} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
