import { getDb } from "../../../db";
import { animals, breedingRecords } from "../../../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { IReportProvider, ReportConfiguration, ReportDataBlock } from "../types";
import { format } from "date-fns";
import { animalIntelligenceService, AnimalAiAlert } from "../../ai/animalIntelligenceService";

export class AnimalAiReportProvider implements IReportProvider {
  getModuleKey(): string {
    return "livestock_ai";
  }

  async generateDataBlock(config: ReportConfiguration): Promise<ReportDataBlock | null> {
    const db = await getDb();
    if (!db) return null;

    const reportId = config.filters?.reportId as string | undefined;

    // ── 1. AI Intelligence & Safety Insights Report ─────────────────────────────
    if (reportId === "animal-ai-insights" || !reportId) {
      try {
        const intel = await animalIntelligenceService.getAnimalIntelligenceSummary(config.farmId);
        const rows: any[] = [];

        for (const alert of intel.alerts) {
          rows.push({
            category: alert.type.replace(/_/g, " ").toUpperCase(),
            animal: alert.animalNameOrTag || `Animal #${alert.animalId}`,
            details: alert.message,
            status: alert.severity.toUpperCase(),
          });
        }

        if (rows.length === 0) {
          rows.push({
            category: "HEALTH & WELFARE",
            animal: "All Livestock & Dairy",
            details: "All monitored animals are within normal physiological and production bounds.",
            status: "NORMAL",
          });
        }

        return {
          title: "KiliSense Animal AI Intelligence & Safety Report",
          columns: [
            { header: "Category", key: "category", width: 30 },
            { header: "Animal / Target", key: "animal", width: 25 },
            { header: "AI Findings & Warnings", key: "details", width: 45 },
            { header: "Status", key: "status", width: 20 },
          ],
          rows,
        };
      } catch (err) {
        console.error("[AnimalAiReportProvider] Error:", err);
      }
    }

    // ── 2. Gestation & Breeding Schedule ──────────────────────────────────────
    if (reportId === "gestation-schedule") {
      const records = await db
        .select({
          breeding: breedingRecords,
          dam: animals,
        })
        .from(breedingRecords)
        .innerJoin(animals, eq(breedingRecords.damId, animals.id))
        .where(
          and(
            eq(breedingRecords.farmId, config.farmId),
            inArray(breedingRecords.pregnancyStatus, ["pending", "confirmed"])
          )
        )
        .orderBy(breedingRecords.expectedDeliveryDate);

      if (records.length === 0) return null;

      const rows = records.map((r) => ({
        dam: r.dam.name || r.dam.tagNumber || `Dam #${r.dam.id}`,
        status: r.breeding.pregnancyStatus.toUpperCase(),
        method: r.breeding.breedingMethod,
        breedingDate: r.breeding.breedingDate ? format(new Date(r.breeding.breedingDate as any), "yyyy-MM-dd") : "—",
        expectedDelivery: r.breeding.expectedDeliveryDate ? format(new Date(r.breeding.expectedDeliveryDate as any), "yyyy-MM-dd") : "—",
        dryOff: r.breeding.dryOffDate ? format(new Date(r.breeding.dryOffDate as any), "yyyy-MM-dd") : "—",
      }));

      return {
        title: "Active Gestation & Dry-Off Schedule",
        columns: [
          { header: "Dam (Mother)", key: "dam", width: 25 },
          { header: "Pregnancy Status", key: "status", width: 20 },
          { header: "Method", key: "method", width: 20 },
          { header: "Breeding Date", key: "breedingDate", width: 20 },
          { header: "Expected Delivery", key: "expectedDelivery", width: 20 },
          { header: "Recommended Dry-off", key: "dryOff", width: 20 },
        ],
        rows,
      };
    }

    return null;
  }
}
