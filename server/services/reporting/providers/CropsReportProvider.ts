import { getDb } from "../../../db";
import { cropPlantings, harvestLogs, fields } from "../../../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { IReportProvider, ReportConfiguration, ReportDataBlock } from "../types";
import { format } from "date-fns";

export class CropsReportProvider implements IReportProvider {
  getModuleKey(): string {
    return "crops";
  }

  async generateDataBlock(config: ReportConfiguration): Promise<ReportDataBlock | null> {
    const db = await getDb();
    if (!db) return null;

    const reportId = config.filters?.reportId as string | undefined;

    if (reportId === "crop-incident-history") {
      // Incident history = crop plantings with issues
      const plantings = await db
        .select()
        .from(cropPlantings)
        .where(eq(cropPlantings.farmId, config.farmId))
        .orderBy(desc(cropPlantings.plantingDate));

      const rows = plantings.map((p) => ({
        crop: p.cropName,
        variety: p.variety || "—",
        field: p.fieldId ? `Field #${p.fieldId}` : "—",
        planted: p.plantingDate ? format(new Date(p.plantingDate as any), "yyyy-MM-dd") : "—",
        status: p.status,
        area: p.quantityPlanted ? `${p.quantityPlanted} ${p.quantityUnit || "kg"}` : "—",
      }));

      if (rows.length === 0) return null;

      return {
        title: "Crop Incident History",
        columns: [
          { header: "Crop", key: "crop", width: 20 },
          { header: "Variety", key: "variety", width: 20 },
          { header: "Field", key: "field", width: 20 },
          { header: "Planted", key: "planted", width: 18 },
          { header: "Status", key: "status", width: 15 },
          { header: "Quantity", key: "area", width: 15 },
        ],
        rows,
      };
    }

    // Default: Yield Analysis — harvest logs
    const conditions: any[] = [eq(harvestLogs.farmId, config.farmId)];
    if (config.dateRange?.from) {
      conditions.push(gte(harvestLogs.harvestDate, config.dateRange.from as any));
    }
    if (config.dateRange?.to) {
      conditions.push(lte(harvestLogs.harvestDate, config.dateRange.to as any));
    }

    const harvests = await db
      .select()
      .from(harvestLogs)
      .where(and(...conditions))
      .orderBy(desc(harvestLogs.harvestDate));

    if (harvests.length === 0) return null;

    const rows = harvests.map((h) => ({
      date: h.harvestDate ? format(new Date(h.harvestDate as any), "yyyy-MM-dd") : "—",
      crop: h.cropName,
      field: h.fieldId ? `Field #${h.fieldId}` : "—",
      quantity: `${h.yieldAmount} ${h.yieldUnit || "kg"}`,
      quality: h.quality || "—",
      notes: h.notes || "—",
    }));

    return {
      title: "Crop Yield Analysis",
      columns: [
        { header: "Harvest Date", key: "date", width: 20 },
        { header: "Crop", key: "crop", width: 20 },
        { header: "Field", key: "field", width: 20 },
        { header: "Quantity", key: "quantity", width: 18 },
        { header: "Quality", key: "quality", width: 15 },
        { header: "Notes", key: "notes", width: 30 },
      ],
      rows,
    };
  }
}
