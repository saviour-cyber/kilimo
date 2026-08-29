import { useState } from "react";
import { useLocation, Link } from "wouter";
import { FileText, ArrowLeft, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ReportWizard() {
  const [, setLocation] = useLocation();
  const { currentFarm } = useFarm();
  const utils = trpc.useUtils();

  const [step, setStep] = useState(1);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [format, setFormat] = useState<"pdf" | "excel" | "csv" | "print">("pdf");

  const generateMutation = trpc.reports.generateReport.useMutation();

  // Find enabled modules that have reports
  const availableModules = MODULE_REGISTRY.filter(m => 
    m.reports && m.reports.length > 0
  );

  const activeModuleDef = availableModules.find(m => m.key === selectedModule);
  const activeReportDef = activeModuleDef?.reports?.find(r => r.id === selectedReport);

  const handleGenerate = async () => {
    if (!currentFarm || !activeModuleDef || !activeReportDef) return;

    try {
      const result = await generateMutation.mutateAsync({
        farmId: currentFarm.farm.id,
        name: `${activeModuleDef.label} - ${activeReportDef.name}`,
        moduleKeys: [activeModuleDef.key],
        format,
      });

      utils.reports.getGeneratedReports.invalidate({ farmId: currentFarm.farm.id });

      toast.success("Report generated successfully!");
      if (result.fileUrl) {
        window.open(result.fileUrl, "_blank");
      }
      setLocation("/reports/archive");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    }
  };

  if (!currentFarm) return null;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 space-y-6">
      <PageHeader 
        title="Generate Report" 
        description={`Step ${step} of 3 - Configure and export`}
      >
        <Button variant="outline" asChild className="gap-2 rounded-full border-2 border-[#1E3F2D] bg-transparent text-[#1E3F2D] hover:bg-[#1E3F2D]/5 font-bold shadow-none hover:text-[#1E3F2D]">
          <Link href="/reports">
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Link>
        </Button>
      </PageHeader>

      <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground tracking-tight">Select Module</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose the business module you want to report on.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableModules.map(mod => {
                const Icon = mod.icon;
                const isSelected = selectedModule === mod.key;
                return (
                  <button
                    key={mod.key}
                    onClick={() => {
                      setSelectedModule(mod.key);
                      setSelectedReport(null); // reset report
                    }}
                    className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all ${
                      isSelected ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border hover:border-black/20 hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-black/5 text-foreground'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[15px] text-foreground">{mod.label}</h3>
                      <p className="text-xs font-medium text-muted-foreground mt-1">{mod.reports?.length} available reports</p>
                    </div>
                    {isSelected && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-primary-foreground" /></div>}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-6 border-t border-border mt-8">
              <Button 
                onClick={() => setStep(2)} 
                disabled={!selectedModule}
                className="rounded-full px-8 bg-[#E5A93D] text-slate-900 hover:bg-[#D4982C] font-bold shadow-none"
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 2 && activeModuleDef && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground tracking-tight">Select Report Type</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose a standard report from the {activeModuleDef.label} module.</p>
            </div>
            
            <div className="space-y-3">
              {activeModuleDef.reports?.map(report => {
                const isSelected = selectedReport === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full flex items-center gap-5 p-5 rounded-2xl border text-left transition-all ${
                      isSelected ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border hover:border-black/20 hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-black/5 text-muted-foreground'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[15px] text-foreground">{report.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                    </div>
                    {isSelected && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-primary-foreground" /></div>}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-6 border-t border-border mt-8">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-full border-2 border-[#1E3F2D] bg-transparent text-[#1E3F2D] hover:bg-[#1E3F2D]/5 font-bold shadow-none hover:text-[#1E3F2D]">Back</Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!selectedReport}
                className="rounded-full px-8 bg-[#E5A93D] text-slate-900 hover:bg-[#D4982C] font-bold shadow-none"
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 3 && activeReportDef && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground tracking-tight">Export & Generate</h2>
              <p className="text-sm text-muted-foreground mt-1">Configure formatting and generate the {activeReportDef.name} report.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Export Format</h3>
              <div className="flex flex-wrap gap-3">
                {activeReportDef.supportedFormats.map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-5 py-3 rounded-full border-2 text-sm font-bold transition-all uppercase tracking-wider ${
                      format === fmt ? 'border-transparent bg-[#E5A93D] text-slate-900 shadow-none' : 'border-[#1E3F2D] bg-transparent text-[#1E3F2D] hover:bg-[#1E3F2D]/5 shadow-none'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-border mt-8">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-full border-2 border-[#1E3F2D] bg-transparent text-[#1E3F2D] hover:bg-[#1E3F2D]/5 font-bold shadow-none hover:text-[#1E3F2D]">Back</Button>
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending}
                className="gap-2 rounded-full px-8 bg-[#E5A93D] text-slate-900 hover:bg-[#D4982C] font-bold shadow-none"
              >
                {generateMutation.isPending ? "Generating..." : (
                  <>
                    <Download className="w-4 h-4" /> Generate {format.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
