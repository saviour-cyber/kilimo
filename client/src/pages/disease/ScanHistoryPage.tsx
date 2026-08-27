import { useState } from "react";
import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import {
  Stethoscope, Clock, CheckCircle, Activity, ShieldAlert,
  AlertTriangle, Search, Filter, PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn } from "@/lib/utils";
import type { DiseaseScan } from "../../../../drizzle/schema";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function severityBadge(severity: string | null) {
  const map: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border border-red-200",
    high:     "bg-orange-100 text-orange-700 border border-orange-200",
    medium:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
    low:      "bg-green-100 text-green-700 border border-green-200",
    unknown:  "bg-muted text-muted-foreground border border-border",
  };
  return map[severity ?? "unknown"] ?? map.unknown;
}

function statusInfo(status: string) {
  const map: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    pending_review: { label: "Pending Review", icon: Clock,        color: "text-amber-500" },
    verified:       { label: "Verified",        icon: CheckCircle, color: "text-green-500" },
    false_positive: { label: "False Positive",  icon: ShieldAlert, color: "text-muted-foreground" },
    treated:        { label: "Treated",         icon: Activity,    color: "text-blue-500" },
  };
  return map[status] ?? map.pending_review;
}

// â”€â”€â”€ Scan Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScanRow({ scan, farmId }: { scan: DiseaseScan; farmId: number }) {
  const { label, icon: StatusIcon, color } = statusInfo(scan.status);
  const utils = trpc.useUtils();

  const updateStatus = trpc.disease.updateScanStatus.useMutation({
    onSuccess: () => {
      utils.disease.getScans.invalidate({ farmId });
      utils.disease.getSummary.invalidate({ farmId });
    },
  });

  const nextStatus = (current: string): "verified" | "treated" | "false_positive" | null => {
    if (current === "pending_review") return "verified";
    if (current === "verified") return "treated";
    return null;
  };

  const next = nextStatus(scan.status);

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-violet-200 hover:shadow-sm transition-all group">
      {/* Image thumbnail */}
      <div className="w-14 h-14 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 overflow-hidden">
        <img
          src={scan.imageUrl}
          alt={scan.detectedDisease ?? "Scan image"}
          className="w-full h-full object-cover rounded-xl"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <Stethoscope className="w-6 h-6 text-violet-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="font-semibold text-foreground text-sm truncate max-w-xs">
            {scan.detectedDisease ?? "Analysis pendingâ€¦"}
          </p>
          <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", severityBadge(scan.severity))}>
            {scan.severity}
          </span>
          <span className="text-[10px] capitalize text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {scan.scanType}
          </span>
        </div>

        {scan.recommendation && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{scan.recommendation.split("|")[0]?.trim()}</p>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className={cn("flex items-center gap-1 text-xs font-medium", color)}>
            <StatusIcon className="w-3 h-3" />
            {label}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(scan.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {scan.confidenceScore && (
            <span className="text-xs text-muted-foreground">
              {parseFloat(String(scan.confidenceScore)).toFixed(0)}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {next && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity border-violet-200 text-primary hover:bg-violet-50 text-xs"
          disabled={updateStatus.isPending}
          onClick={() => updateStatus.mutate({ id: scan.id, farmId, status: next })}
        >
          Mark {next === "verified" ? "Verified" : "Treated"}
        </Button>
      )}
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ScanHistoryPage() {
  const { currentFarm } = useFarm();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: scans = [], isLoading } = trpc.disease.getScans.useQuery(
    {
      farmId: currentFarm?.farm.id ?? 0,
      scanType: typeFilter as any,
      status: statusFilter as any,
      limit: 50,
    },
    { enabled: !!currentFarm?.farm.id }
  );

  const filteredScans = scans.filter((s) =>
    !searchQuery || s.detectedDisease?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentFarm) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Scan History"
        description="All disease detection scans for this farm"
        icon={Stethoscope}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        action={
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-white gap-2">
            <a href="/disease/scan">
              <PlusCircle className="w-4 h-4" /> New Scan
            </a>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by disease nameâ€¦"
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="crop">Crop</SelectItem>
            <SelectItem value="livestock">Livestock</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="treated">Treated</SelectItem>
            <SelectItem value="false_positive">False Positive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scan list */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : filteredScans.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No scans found"
          description={
            searchQuery || typeFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "Run your first disease scan to start detecting issues early."
          }
          action={
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-white gap-2">
              <a href="/disease/scan"><PlusCircle className="w-4 h-4" /> Run First Scan</a>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-1">
            {filteredScans.length} scan{filteredScans.length !== 1 ? "s" : ""}
          </p>
          {filteredScans.map((scan) => (
            <ScanRow key={scan.id} scan={scan} farmId={currentFarm.farm.id} />
          ))}
        </div>
      )}
    </div>
  );
}