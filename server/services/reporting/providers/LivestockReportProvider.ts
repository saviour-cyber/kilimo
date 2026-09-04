import { getDb } from "../../../db";
import { animals, healthLogs, productionRecords } from "../../../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { IReportProvider, ReportConfiguration, ReportDataBlock } from "../types";
import { format } from "date-fns";

export class LivestockReportProvider implements IReportProvider {
  getModuleKey(): string {
    return "livestock";
  }

  async generateDataBlock(config: ReportConfiguration): Promise<ReportDataBlock | null> {
    const db = await getDb();
    if (!db) return null;

    const reportId = config.filters?.reportId as string | undefined;

    if (reportId === "livestock-production-summary") {
      const conditions: any[] = [eq(productionRecords.farmId, config.farmId)];
      if (config.dateRange?.from) {
        conditions.push(gte(productionRecords.recordDate, config.dateRange.from as any));
      }
      if (config.dateRange?.to) {
        conditions.push(lte(productionRecords.recordDate, config.dateRange.to as any));
      }

      const records = await db
        .select()
        .from(productionRecords)
        .where(and(...conditions))
        .orderBy(desc(productionRecords.recordDate));

      if (records.length === 0) return null;

      const rows = records.map((r) => ({
        date: r.recordDate ? format(new Date(r.recordDate as any), "yyyy-MM-dd") : "—",
        type: r.productType,
        quantity: `${r.quantity} ${r.unit || ""}`.trim(),
        notes: r.notes || "—",
      }));

      return {
        title: "Livestock Production Summary",
        columns: [
          { header: "Date", key: "date", width: 20 },
          { header: "Production Type", key: "type", width: 25 },
          { header: "Quantity", key: "quantity", width: 20 },
          { header: "Notes", key: "notes", width: 35 },
        ],
        rows,
      };
    }

    // Default: Health Records
    const conditions: any[] = [eq(healthLogs.farmId, config.farmId)];
    if (config.dateRange?.from) {
      conditions.push(gte(healthLogs.performedDate, config.dateRange.from as any));
    }
    if (config.dateRange?.to) {
      conditions.push(lte(healthLogs.performedDate, config.dateRange.to as any));
    }

    const logs = await db
      .select()
      .from(healthLogs)
      .where(and(...conditions))
      .orderBy(desc(healthLogs.performedDate));

    if (logs.length === 0) return null;

    const rows = logs.map((h) => ({
      date: h.performedDate ? format(new Date(h.performedDate as any), "yyyy-MM-dd") : "—",
      type: h.logType || "—",
      title: h.title || "—",
      performedBy: h.performedBy || "—",
      notes: h.notes || "—",
    }));

    return {
      title: "Livestock Health Records",
      columns: [
        { header: "Date", key: "date", width: 20 },
        { header: "Type", key: "type", width: 20 },
        { header: "Title", key: "title", width: 30 },
        { header: "Performed By", key: "performedBy", width: 20 },
        { header: "Notes", key: "notes", width: 30 },
      ],
      rows,
    };
  }
}
