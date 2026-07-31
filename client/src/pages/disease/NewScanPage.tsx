import { useState, useRef, useCallback } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Upload, ImagePlus, Stethoscope, Loader2, AlertTriangle,
  CheckCircle, ShieldAlert, ChevronRight, X, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────
type ScanType = "crop" | "livestock" | "other";
type ScanState = "idle" | "uploading" | "scanning" | "done" | "error";

interface ScanResult {
  diagnosis: { likelyDisease: string; confidence: string; recommendations: string[]; isolationRequired: boolean };
  severity: string;
  confidenceScore: string;
  recommendation: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function severityConfig(severity: string) {
  const map: Record<string, { color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
    critical: { color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",    icon: AlertTriangle },
    high:     { color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200", icon: AlertTriangle },
    medium:   { color: "text-yellow-700", bg: "bg-yellow-50",  border: "border-yellow-200", icon: Activity },
    low:      { color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle },
  };
  return map[severity] ?? { color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: Stethoscope };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewScanPage() {
  const { currentFarm } = useFarm();
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitScan = trpc.disease.submitScan.useMutation();
  const [scanType, setScanType] = useState<ScanType>("crop");
  // Detect scanType from farm type
  const farmType = currentFarm?.farm.farmType ?? "mixed";
  const allowedTypes: ScanType[] = farmType === "crop" ? ["crop"]
    : farmType === "livestock" ? ["livestock"]
    : ["crop", "livestock", "other"];

  // Auto-select for single-type farms
  const effectiveScanType: ScanType =
    allowedTypes.length === 1 ? allowedTypes[0] : scanType;

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", { description: "Please upload an image file." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Please upload an image under 10 MB." });
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFileName(file.name);
    setResult(null);
    setState("idle");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleScan = async () => {
    if (!currentFarm || !preview) return;
    setState("scanning");
    try {
      // In production, upload image to storage and get a real URL.
      // For Phase 1, we pass a deterministic mock URL derived from the filename.
      const mockImageUrl = `https://kilimohub-mock.storage/uploads/${Date.now()}-${fileName ?? "scan.jpg"}`;

      const res = await submitScan.mutateAsync({
        farmId: currentFarm.farm.id,
        scanType: effectiveScanType,
        imageUrl: mockImageUrl,
        notes: notes.trim() || undefined,
      });
      setResult(res as ScanResult);
      setState("done");
      utils.disease.getSummary.invalidate({ farmId: currentFarm.farm.id });
      utils.disease.getScans.invalidate({ farmId: currentFarm.farm.id });
      toast.success("Scan complete", { description: `Detected: ${res.diagnosis.likelyDisease}` });
    } catch (err: any) {
      setState("error");
      toast.error("Scan failed", { description: err.message ?? "An error occurred." });
    }
  };

  const reset = () => {
    setPreview(null);
    setFileName(null);
    setResult(null);
    setNotes("");
    setState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sev = result ? severityConfig(result.severity) : null;
  const SevIcon = sev?.icon ?? Stethoscope;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Disease Scan</h1>
          <p className="text-sm text-slate-500">Upload a photo — Kili AI will analyse it for diseases</p>
        </div>
        {state === "scanning" && (
          <Badge className="ml-auto bg-violet-100 text-violet-700 border border-violet-200 animate-pulse">
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Analysing…
          </Badge>
        )}
      </div>

      {/* Scan type selector (only on mixed/other farms) */}
      {allowedTypes.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700 shrink-0">Scan Type</label>
          <Select value={scanType} onValueChange={(v) => setScanType(v as ScanType)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedTypes.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${dragOver ? "border-violet-500 bg-violet-50 scale-[1.01]" : "border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/30"}
          ${preview ? "border-solid border-violet-200 bg-white" : ""}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Uploaded for scanning" className="w-full max-h-72 object-contain rounded-2xl" />
            {state !== "scanning" && (
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-slate-600 font-medium shadow-sm">
              {fileName}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
              <ImagePlus className="w-7 h-7 text-violet-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700">Drag & drop or click to upload</p>
              <p className="text-sm text-slate-400 mt-1">PNG, JPG, WEBP up to 10 MB</p>
            </div>
            <Button size="sm" variant="outline" className="mt-1 border-violet-200 text-violet-700 hover:bg-violet-50">
              <Upload className="w-4 h-4 mr-2" /> Choose Image
            </Button>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Additional Observations <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe visible symptoms, affected area, duration…"
          className="resize-none h-24 border-slate-200 focus:border-violet-300"
          disabled={state === "scanning"}
        />
      </div>

      {/* Scan button */}
      {state !== "done" && (
        <Button
          onClick={handleScan}
          disabled={!preview || state === "scanning" || !currentFarm}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 rounded-xl font-semibold gap-2"
        >
          {state === "scanning" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running AI Analysis…</>
          ) : (
            <><Stethoscope className="w-4 h-4" /> Analyse with Kili AI</>
          )}
        </Button>
      )}

      {/* Results card */}
      {state === "done" && result && sev && (
        <div className={`rounded-2xl border-2 ${sev.border} ${sev.bg} p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          {/* Result header */}
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sev.bg} border ${sev.border}`}>
              <SevIcon className={`w-5 h-5 ${sev.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`font-bold text-base ${sev.color}`}>{result.diagnosis.likelyDisease}</h2>
                <Badge className={`text-[10px] uppercase ${sev.bg} ${sev.color} border ${sev.border}`}>
                  {result.severity} severity
                </Badge>
                <Badge variant="outline" className="text-[10px] text-slate-500">
                  {result.diagnosis.confidence} confidence
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan type: <span className="capitalize font-medium">{effectiveScanType}</span>
                {result.diagnosis.isolationRequired && (
                  <span className="ml-2 text-red-600 font-semibold">⚠ Isolation recommended</span>
                )}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Treatment Recommendations</p>
            <ol className="space-y-1.5">
              {result.diagnosis.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${sev.color} ${sev.bg} border ${sev.border}`}>
                    {i + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button onClick={reset} variant="outline" className="flex-1 border-slate-200 text-slate-700 hover:bg-white">
              Scan Another Image
            </Button>
            <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
              <a href="/disease/history">
                View All Scans <ChevronRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Scan failed</p>
            <p className="text-xs text-red-500">Please try again or check your connection.</p>
          </div>
          <Button onClick={reset} size="sm" variant="outline" className="ml-auto border-red-200 text-red-600 hover:bg-red-100">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
