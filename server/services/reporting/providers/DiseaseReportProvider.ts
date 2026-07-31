import { getDb } from "../../../db";
import { diseaseScans } from "../../../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { IReportProvider, ReportConfiguration, ReportDataBlock } from "../types";
import { format } from "date-fns";

export class DiseaseReportProvider implements IReportProvider {
  getModuleKey(): string {
    return "disease";
  }

  async generateDataBlock(config: ReportConfiguration): Promise<ReportDataBlock | null> {
    const db = await getDb();
    if (!db) return null;

    let conditions = [eq(diseaseScans.farmId, config.farmId)];

    if (config.dateRange?.from) {
      conditions.push(gte(diseaseScans.createdAt, new Date(config.dateRange.from)));
    }
    if (config.dateRange?.to) {
      conditions.push(lte(diseaseScans.createdAt, new Date(config.dateRange.to)));
    }

    const scans = await db
      .select()
      .from(diseaseScans)
      .where(and(...conditions))
      .orderBy(desc(diseaseScans.createdAt));

    if (scans.length === 0) return null;

    const rows = scans.map((scan) => ({
      date: format(new Date(scan.createdAt), "yyyy-MM-dd HH:mm"),
      crop: scan.scanType.toUpperCase(),
      disease: scan.detectedDisease || "Unknown",
      confidence: scan.confidenceScore ? `${Math.round(parseFloat(scan.confidenceScore) * 100)}%` : "N/A",
      status: scan.status,
    }));

    return {
      title: "Disease & Pest Detection Scans",
      columns: [
        { header: "Date", key: "date", width: 25 },
        { header: "Crop", key: "crop", width: 20 },
        { header: "Disease Detected", key: "disease", width: 35 },
        { header: "Confidence", key: "confidence", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ],
      rows,
    };
  }
}
