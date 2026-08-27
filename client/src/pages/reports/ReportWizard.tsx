import { useState } from "react";
import { useLocation } from "wouter";
import { FileText, ArrowLeft, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";
import { toast } from "sonner";

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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/reports")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Generate Report</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Select Module</h2>
              <p className="text-sm text-muted-foreground">Choose the business module you want to report on.</p>
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
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50' : 'border-border hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${mod.color.replace('text-', 'bg-').replace('600', '100')} text-${mod.color.split('-')[1]}-600`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{mod.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{mod.reports?.length} available reports</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-indigo-600" />}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => setStep(2)} 
                disabled={!selectedModule}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 2 && activeModuleDef && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Select Report Type</h2>
              <p className="text-sm text-muted-foreground">Choose a standard report from the {activeModuleDef.label} module.</p>
            </div>
            
            <div className="space-y-3">
              {activeModuleDef.reports?.map(report => {
                const isSelected = selectedReport === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50' : 'border-border hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{report.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-indigo-600" />}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!selectedReport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 3 && activeReportDef && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Export & Generate</h2>
              <p className="text-sm text-muted-foreground">Configure formatting and generate the {activeReportDef.name} report.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Export Format</h3>
              <div className="flex flex-wrap gap-3">
                {activeReportDef.supportedFormats.map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all uppercase ${
                      format === fmt ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-8">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
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
