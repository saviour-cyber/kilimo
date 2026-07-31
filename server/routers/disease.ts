import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { diseaseScans, notifications } from "../../drizzle/schema";
import { getAIProvider } from "../services/ai";
import { TRPCError } from "@trpc/server";

// ─── Severity helpers ─────────────────────────────────────────────────────────

function confidenceToScore(confidence: "low" | "medium" | "high"): string {
  return confidence === "high" ? "90.00" : confidence === "medium" ? "65.00" : "35.00";
}

function confidenceToSeverity(
  confidence: "low" | "medium" | "high",
  isolationRequired: boolean
): "low" | "medium" | "high" | "critical" | "unknown" {
  if (isolationRequired && confidence === "high") return "critical";
  if (confidence === "high") return "high";
  if (confidence === "medium") return "medium";
  return "low";
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const diseaseRouter = router({
  // ── List all scans for current farm ────────────────────────────────────────
  getScans: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        scanType: z.enum(["crop", "livestock", "other", "all"]).optional().default("all"),
        status: z
          .enum(["pending_review", "verified", "false_positive", "treated", "all"])
          .optional()
          .default("all"),
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(diseaseScans.farmId, input.farmId)];
      if (input.scanType !== "all") conditions.push(eq(diseaseScans.scanType, input.scanType));
      if (input.status !== "all") conditions.push(eq(diseaseScans.status, input.status));

      const rows = await db
        .select()
        .from(diseaseScans)
        .where(and(...conditions))
        .orderBy(desc(diseaseScans.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows;
    }),

  // ── Get single scan ─────────────────────────────────────────────────────────
  getScan: protectedProcedure
    .input(z.object({ id: z.number(), farmId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [scan] = await db
        .select()
        .from(diseaseScans)
        .where(and(eq(diseaseScans.id, input.id), eq(diseaseScans.farmId, input.farmId)))
        .limit(1);

      if (!scan) throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found" });
      return scan;
    }),

  // ── Submit a scan (delegates to Kili AI) ────────────────────────────────────
  submitScan: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        scanType: z.enum(["crop", "livestock", "other"]),
        imageUrl: z.string().url({ message: "Must be a valid image URL" }),
        relatedEntityId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // ── 1. Delegate to Kili AI Provider (never hardcode AI logic here) ──────
      const aiProvider = getAIProvider();
      const aiScanType = input.scanType === "other" ? "crop" : input.scanType;
      const diagnosis = await aiProvider.analyzeDiseaseImage(input.imageUrl, aiScanType);

      const confidenceScore = confidenceToScore(diagnosis.confidence);
      const severity = confidenceToSeverity(diagnosis.confidence, diagnosis.isolationRequired);
      const recommendation = diagnosis.recommendations.join(" | ");

      // ── 2. Persist scan result ───────────────────────────────────────────────
      await db.insert(diseaseScans).values({
        farmId: input.farmId,
        scanType: input.scanType,
        imageUrl: input.imageUrl,
        detectedDisease: diagnosis.likelyDisease,
        confidenceScore,
        severity,
        recommendation,
        status: "pending_review",
        relatedEntityId: input.relatedEntityId ?? null,
        notes: input.notes ?? null,
        scannedByUserId: ctx.user.id,
      });

      // ── 3. Publish event to Notifications Platform Service ───────────────────
      // Only create a notification for medium+ severity findings
      if (severity === "high" || severity === "critical") {
        await db.insert(notifications).values({
          farmId: input.farmId,
          userId: ctx.user.id,
          title: `⚠️ Disease Alert: ${diagnosis.likelyDisease}`,
          message: `A ${severity} severity ${input.scanType} disease was detected. Immediate action recommended: ${diagnosis.recommendations[0]}`,
          type: severity === "critical" ? "alert" : "warning",
          category: input.scanType === "livestock" ? "livestock" : "crop",
          isRead: false,
          relatedEntityType: "diseaseScan",
        });
      }

      return {
        success: true,
        diagnosis,
        severity,
        confidenceScore,
        recommendation,
      };
    }),

  // ── Update scan verification status ─────────────────────────────────────────
  updateScanStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        farmId: z.number(),
        status: z.enum(["pending_review", "verified", "false_positive", "treated"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(diseaseScans)
        .set({
          status: input.status,
          notes: input.notes ?? undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(diseaseScans.id, input.id), eq(diseaseScans.farmId, input.farmId)));

      return { success: true };
    }),

  // ── Summary stats (for Dashboard KPI Widgets) ───────────────────────────────
  getSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, pending: 0, critical: 0, treated: 0, recentScans: [] };

      const allScans = await db
        .select()
        .from(diseaseScans)
        .where(eq(diseaseScans.farmId, input.farmId))
        .orderBy(desc(diseaseScans.createdAt))
        .limit(50);

      const total = allScans.length;
      const pending = allScans.filter((s) => s.status === "pending_review").length;
      const critical = allScans.filter((s) => s.severity === "critical" || s.severity === "high").length;
      const treated = allScans.filter((s) => s.status === "treated").length;
      const recentScans = allScans.slice(0, 5);

      return { total, pending, critical, treated, recentScans };
    }),
});
