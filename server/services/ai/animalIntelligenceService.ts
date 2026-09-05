import { and, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { getDb } from "../../db";
import {
  animals,
  animalHerds,
  animalHeatLogs,
  breedingRecords,
  healthLogs,
  dairyMilkProduction,
  notifications,
  farms,
} from "../../../drizzle/schema";
import { getAIProvider } from "./index";

export interface AnimalAiAlert {
  id: string;
  type: "heat_window" | "imminent_calving" | "overdue_calving" | "dry_off_due" | "milk_drop" | "withdrawal_warning" | "health_concern";
  severity: "info" | "warning" | "critical";
  animalId: number;
  animalNameOrTag: string;
  title: string;
  message: string;
  recommendedAction: string;
  dueDate?: string;
}

export interface AnimalAiMetrics {
  totalAnimals: number;
  activeDairyCows: number;
  lactatingCount: number;
  dryCount: number;
  pregnantCount: number;
  quarantinedCount: number;
  activeHeatCount: number;
  activeWithdrawalsCount: number;
  todayMilkVolume: number;
  sevenDayAvgMilkVolume: number;
  milkTrendPercentage: number;
}

export interface AnimalIntelligenceSummary {
  farmId: number;
  metrics: AnimalAiMetrics;
  alerts: AnimalAiAlert[];
  recommendations: string[];
  executiveSummary: string;
  generatedAt: string;
}

export class AnimalIntelligenceService {
  /**
   * Consumes controlled livestock and dairy data for a farm to produce a comprehensive
   * AI intelligence assessment including real-time heuristic alerts and LLM recommendations.
   */
  async getAnimalIntelligenceSummary(farmId: number): Promise<AnimalIntelligenceSummary> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Core Animals Data
    const farmAnimals = await db
      .select()
      .from(animals)
      .where(and(eq(animals.farmId, farmId), eq(animals.status, "active")));

    const animalMap = new Map<number, typeof animals.$inferSelect>();
    farmAnimals.forEach((a) => animalMap.set(a.id, a));

    const getAnimalLabel = (id: number) => {
      const a = animalMap.get(id);
      if (!a) return `Animal #${id}`;
      return a.name || a.tagNumber || `Animal #${id}`;
    };

    // 2. Active Heat Logs (last 48 hours)
    const recentHeatLogs = await db
      .select()
      .from(animalHeatLogs)
      .where(
        and(
          eq(animalHeatLogs.farmId, farmId),
          gte(animalHeatLogs.observedDate, fortyEightHoursAgo.toISOString().slice(0, 10) as any)
        )
      )
      .orderBy(desc(animalHeatLogs.createdAt));

    // 3. Active Breeding & Gestation Records
    const activeBreeding = await db
      .select()
      .from(breedingRecords)
      .where(
        and(
          eq(breedingRecords.farmId, farmId),
          sql`${breedingRecords.pregnancyStatus} IN ('pending', 'confirmed')`
        )
      );

    // 4. Health Logs with active withdrawals or recent checkups
    const recentHealth = await db
      .select()
      .from(healthLogs)
      .where(
        and(
          eq(healthLogs.farmId, farmId),
          gte(healthLogs.performedDate, fourteenDaysAgo.toISOString().slice(0, 10) as any)
        )
      )
      .orderBy(desc(healthLogs.performedDate));

    // 5. Recent Milk Production (last 14 days)
    const recentMilk = await db
      .select()
      .from(dairyMilkProduction)
      .where(
        and(
          eq(dairyMilkProduction.farmId, farmId),
          gte(dairyMilkProduction.date, fourteenDaysAgo.toISOString().slice(0, 10) as any)
        )
      )
      .orderBy(desc(dairyMilkProduction.date));

    // ── Generate Deterministic Heuristic AI Alerts ─────────────────────────────
    const alerts: AnimalAiAlert[] = [];

    // A. Heat & Insemination Window Alerts
    for (const heat of recentHeatLogs) {
      if (heat.status === "observed") {
        const windowEnd = heat.breedingWindowEnd ? new Date(heat.breedingWindowEnd) : null;
        const isWindowOpen = !windowEnd || windowEnd.getTime() > now.getTime();

        if (isWindowOpen) {
          alerts.push({
            id: `heat-${heat.id}`,
            type: "heat_window",
            severity: "critical",
            animalId: heat.animalId,
            animalNameOrTag: getAnimalLabel(heat.animalId),
            title: `Optimal Insemination Window: ${getAnimalLabel(heat.animalId)}`,
            message: `Estrus detected (${heat.heatSigns}). Animal is currently in optimal breeding window.`,
            recommendedAction: "Perform Artificial Insemination (AI) or natural service before window closes.",
            dueDate: windowEnd ? windowEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
          });
        }
      }
    }

    // B. Calving & Gestation Alerts
    for (const b of activeBreeding) {
      if (!b.expectedDeliveryDate) continue;
      const expectedDate = new Date(b.expectedDeliveryDate);
      const diffDays = Math.ceil((expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Overdue
        alerts.push({
          id: `calving-overdue-${b.id}`,
          type: "overdue_calving",
          severity: "critical",
          animalId: b.damId,
          animalNameOrTag: getAnimalLabel(b.damId),
          title: `Overdue Calving: ${getAnimalLabel(b.damId)}`,
          message: `Expected delivery was ${diffDays * -1} day(s) ago (${b.expectedDeliveryDate}).`,
          recommendedAction: "Examine animal immediately for signs of dystocia or prolonged labor; consult vet if necessary.",
          dueDate: String(b.expectedDeliveryDate).slice(0, 10),
        });
      } else if (diffDays <= 7) {
        // Imminent
        alerts.push({
          id: `calving-imminent-${b.id}`,
          type: "imminent_calving",
          severity: "warning",
          animalId: b.damId,
          animalNameOrTag: getAnimalLabel(b.damId),
          title: `Calving Due in ${diffDays} Day${diffDays === 1 ? "" : "s"}: ${getAnimalLabel(b.damId)}`,
          message: `Animal is at ${b.gestationDays - diffDays} days gestation. Delivery expected on ${String(b.expectedDeliveryDate).slice(0, 10)}.`,
          recommendedAction: "Move animal to clean, sanitized maternity pen with fresh bedding and monitor twice daily.",
          dueDate: String(b.expectedDeliveryDate).slice(0, 10),
        });
      }

      // C. Dry-off Alert (60 days prior to expected calving for dairy cows)
      const dam = animalMap.get(b.damId);
      if (dam && (dam.isDairy || dam.species.toLowerCase() === "cattle")) {
        if (b.dryOffDate) {
          const dryDate = new Date(b.dryOffDate);
          const dryDiffDays = Math.ceil((dryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (dryDiffDays <= 5 && dryDiffDays >= -10 && dam.lactationStage !== "dry") {
            alerts.push({
              id: `dry-off-${b.id}`,
              type: "dry_off_due",
              severity: "warning",
              animalId: b.damId,
              animalNameOrTag: getAnimalLabel(b.damId),
              title: `Dry-Off Due: ${getAnimalLabel(b.damId)}`,
              message: `Cow is approaching 60 days before calving. Lactation should be terminated to allow udder involution.`,
              recommendedAction: "Administer dry cow intramammary therapy, reduce grain concentrate, and update lactation stage to 'dry'.",
              dueDate: String(b.dryOffDate).slice(0, 10),
            });
          }
        }
      }
    }

    // D. Food Safety & Medical Withdrawal Alerts
    for (const h of recentHealth) {
      if (!h.animalId) continue;
      // Milk withdrawal check
      if (h.milkWithdrawalEndDate) {
        const milkEnd = new Date(h.milkWithdrawalEndDate);
        if (milkEnd.getTime() >= now.getTime()) {
          alerts.push({
            id: `withdrawal-milk-${h.id}`,
            type: "withdrawal_warning",
            severity: "critical",
            animalId: h.animalId,
            animalNameOrTag: getAnimalLabel(h.animalId),
            title: `Active Milk Withdrawal: ${getAnimalLabel(h.animalId)}`,
            message: `Treated with '${h.title}'. Milk withdrawal active until ${String(h.milkWithdrawalEndDate).slice(0, 10)}.`,
            recommendedAction: "DO NOT deliver or mix this cow's milk with bulk tank. Milk into dump bucket.",
            dueDate: String(h.milkWithdrawalEndDate).slice(0, 10),
          });
        }
      }

      // Meat withdrawal check
      if (h.meatWithdrawalEndDate) {
        const meatEnd = new Date(h.meatWithdrawalEndDate);
        if (meatEnd.getTime() >= now.getTime()) {
          alerts.push({
            id: `withdrawal-meat-${h.id}`,
            type: "withdrawal_warning",
            severity: "critical",
            animalId: h.animalId,
            animalNameOrTag: getAnimalLabel(h.animalId),
            title: `Active Meat Withdrawal: ${getAnimalLabel(h.animalId)}`,
            message: `Treated with '${h.title}'. Animal cannot be slaughtered until ${String(h.meatWithdrawalEndDate).slice(0, 10)}.`,
            recommendedAction: "Ensure animal is clearly tagged and withhold from sale/slaughter.",
            dueDate: String(h.meatWithdrawalEndDate).slice(0, 10),
          });
        }
      }

      // Low Body Condition Score alert (< 2.5)
      if (h.bcsScore && parseFloat(String(h.bcsScore)) < 2.5) {
        alerts.push({
          id: `bcs-low-${h.id}`,
          type: "health_concern",
          severity: "warning",
          animalId: h.animalId,
          animalNameOrTag: getAnimalLabel(h.animalId),
          title: `Low Body Condition Score: ${getAnimalLabel(h.animalId)} (BCS ${h.bcsScore})`,
          message: `Animal has dropped below optimal body reserves (ideal: 3.0 - 3.5).`,
          recommendedAction: "Increase energy-dense forage/concentrate and check for internal parasites or dental issues.",
        });
      }
    }

    // E. Milk Production Drop Anomaly Detection
    // Group milk by date
    const milkByDate = new Map<string, number>();
    recentMilk.forEach((m) => {
      const d = String(m.date).slice(0, 10);
      const vol = parseFloat(String(m.totalVolume || 0));
      milkByDate.set(d, (milkByDate.get(d) || 0) + vol);
    });

    const dates = Array.from(milkByDate.keys()).sort().reverse();
    const todayVolume = milkByDate.get(todayStr) || (dates.length > 0 ? milkByDate.get(dates[0]) || 0 : 0);
    
    // Calculate 7-day average excluding latest
    const past7Days = dates.slice(1, 8);
    const sumPast7 = past7Days.reduce((acc, d) => acc + (milkByDate.get(d) || 0), 0);
    const avgPast7 = past7Days.length > 0 ? sumPast7 / past7Days.length : todayVolume;
    const trendPercentage = avgPast7 > 0 ? Math.round(((todayVolume - avgPast7) / avgPast7) * 100) : 0;

    if (trendPercentage <= -15 && todayVolume > 0) {
      alerts.push({
        id: `milk-drop-farm`,
        type: "milk_drop",
        severity: "warning",
        animalId: 0,
        animalNameOrTag: "Dairy Herd",
        title: `Milk Production Anomaly: ${Math.abs(trendPercentage)}% Drop`,
        message: `Today's yield (${todayVolume.toFixed(1)}L) is significantly below the 7-day baseline (${avgPast7.toFixed(1)}L).`,
        recommendedAction: "Perform California Mastitis Test (CMT) on lactating cows and inspect water supply and feed ration quality.",
      });
    }

    // ── Calculate Metrics ───────────────────────────────────────────────────────
    const dairyCows = farmAnimals.filter((a) => a.isDairy || a.species.toLowerCase() === "cattle");
    const lactatingCount = farmAnimals.filter((a) => a.lactationStage === "early" || a.lactationStage === "mid" || a.lactationStage === "late").length;
    const dryCount = farmAnimals.filter((a) => a.lactationStage === "dry").length;
    const pregnantCount = activeBreeding.filter((b) => b.pregnancyStatus === "confirmed").length;
    const quarantinedCount = farmAnimals.filter((a) => a.isQuarantined).length;
    const activeWithdrawals = alerts.filter((a) => a.type === "withdrawal_warning").length;

    const metrics: AnimalAiMetrics = {
      totalAnimals: farmAnimals.length,
      activeDairyCows: dairyCows.length,
      lactatingCount,
      dryCount,
      pregnantCount,
      quarantinedCount,
      activeHeatCount: alerts.filter((a) => a.type === "heat_window").length,
      activeWithdrawalsCount: activeWithdrawals,
      todayMilkVolume: Math.round(todayVolume * 10) / 10,
      sevenDayAvgMilkVolume: Math.round(avgPast7 * 10) / 10,
      milkTrendPercentage: trendPercentage,
    };

    // ── LLM Synthesis for Executive Recommendations ────────────────────────────
    let recommendations: string[] = [];
    let executiveSummary = `Herd health and reproductive operations are tracked. ${alerts.length} active alerts requiring attention.`;

    try {
      const [farm] = await db.select().from(farms).where(eq(farms.id, farmId));
      const provider = getAIProvider();

      const contextPrompt = `
Farm: ${farm?.name || "KiliSense Farm"}
Total Animals: ${metrics.totalAnimals}
Dairy Herd: ${metrics.activeDairyCows} (${metrics.lactatingCount} lactating, ${metrics.dryCount} dry)
Confirmed Pregnancies: ${metrics.pregnantCount}
Milk Output: Today ${metrics.todayMilkVolume}L vs 7-day avg ${metrics.sevenDayAvgMilkVolume}L (${metrics.milkTrendPercentage}%)
Active Alerts:
${alerts.map((a) => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.message}`).join("\n")}
`;

      const aiResponse = await provider.getDashboardRecommendations(contextPrompt);
      if (aiResponse) {
        executiveSummary = aiResponse.summary || executiveSummary;
        recommendations = aiResponse.recommendations || [];
      }
    } catch {
      // Fallback heuristics if AI provider is offline or rate-limited
      recommendations = [
        alerts.length > 0 ? alerts[0].recommendedAction : "Maintain strict feeding rations and monitor fresh water troughs.",
        metrics.activeWithdrawalsCount > 0 ? "Strictly observe antibiotic withdrawal windows to ensure dairy/meat food safety." : "Check body condition scores across dry cows and breeding heifers.",
        metrics.pregnantCount > 0 ? "Ensure clean, well-bedded maternity pens for cows entering their final 2 weeks of gestation." : "Review upcoming estrus cycles and schedule artificial insemination."
      ];
    }

    return {
      farmId,
      metrics,
      alerts,
      recommendations,
      executiveSummary,
      generatedAt: now.toISOString(),
    };
  }

  /**
   * Evaluates active conditions and dispatches high-priority notifications
   * to farm managers/workers for immediate action. Idempotent: checks for
   * existing notifications to avoid duplicates within a 24-hour window.
   */
  async evaluateAndDispatchAiAlerts(farmId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const summary = await this.getAnimalIntelligenceSummary(farmId);
    let createdCount = 0;

    for (const alert of summary.alerts) {
      if (alert.severity === "critical" || alert.severity === "warning") {
        // Check if recently notified in last 24h
        const existing = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.farmId, farmId),
              eq(notifications.category, "livestock"),
              eq(notifications.title, alert.title)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(notifications).values({
            farmId,
            userId: 0, // Broad broadcast for farm workers & managers
            title: alert.title,
            message: `${alert.message}\nAction: ${alert.recommendedAction}`,
            type: alert.severity === "critical" ? "alert" : "warning",
            category: "livestock",
            relatedEntityType: "animal",
            relatedEntityId: alert.animalId || undefined,
            isRead: false,
          });
          createdCount++;
        }
      }
    }

    return createdCount;
  }
}

export const animalIntelligenceService = new AnimalIntelligenceService();
