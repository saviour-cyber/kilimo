import { Link } from "wouter";
import { Archive, ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ReportArchive() {
  const { currentFarm } = useFarm();
  
  const { data: reports = [], isLoading } = trpc.reports.getGeneratedReports.useQuery(
    { farmId: currentFarm?.farm.id ?? 0, limit: 100 },
    { enabled: !!currentFarm?.farm.id }
  );

  if (!currentFarm) return null;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 space-y-6">
      <PageHeader 
        title="Report Archive" 
        description="History of all generated reports"
      >
        <Button variant="outline" asChild className="gap-2 rounded-xl border-black/10">
          <Link href="/reports">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </Button>
      </PageHeader>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading archive...</div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">No reports found.</p>
            <p className="text-sm text-muted-foreground mt-1">Generated reports will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reports.map(report => (
              <div key={report.id} className="p-5 flex items-center justify-between hover:bg-black/[0.01] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[15px] text-foreground">{report.name}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5 max-w-xl truncate">
                      {report.filters ? JSON.stringify(report.filters) : "No filters applied"}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-medium text-muted-foreground">
                      <span>{format(new Date(report.generatedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      <span>•</span>
                      <span className="uppercase tracking-wider">{report.format}</span>
                    </div>
                  </div>
                </div>
                {report.fileUrl && (
                  <Button variant="outline" asChild className="rounded-xl border-black/10 hover:bg-black/5">
                    <a href={report.fileUrl} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4 mr-2 text-muted-foreground" /> Download
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
