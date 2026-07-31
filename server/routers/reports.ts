import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { scheduledReports, generatedReports, farmModules } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { ExportService } from "../services/exportService";
import { ReportEngine } from "../services/reporting/ReportEngine";

export const reportsRouter = router({
  // ── List Generated Reports ───────────────────────────────────────────────────
  getGeneratedReports: protectedProcedure
    .input(z.object({ farmId: z.number(), limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      return db
        .select()
        .from(generatedReports)
        .where(eq(generatedReports.farmId, input.farmId))
        .orderBy(desc(generatedReports.generatedAt))
        .limit(input.limit);
    }),

  // ── List Scheduled Reports ───────────────────────────────────────────────────
  getScheduledReports: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      return db
        .select()
        .from(scheduledReports)
        .where(eq(scheduledReports.farmId, input.farmId))
        .orderBy(desc(scheduledReports.createdAt));
    }),

  generateReport: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      name: z.string(),
      description: z.string().optional(),
      moduleKeys: z.array(z.string()),
      filters: z.any().optional(),
      format: z.enum(["pdf", "excel", "csv", "print"]),
      dateRange: z.object({
        from: z.string(),
        to: z.string(),
      }).optional(),
      grouping: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Build the configuration
      const config = {
        farmId: input.farmId,
        name: input.name,
        description: input.description,
        format: input.format,
        dateRange: input.dateRange,
        modules: input.moduleKeys,
        filters: input.filters,
        grouping: input.grouping,
      };

      const engine = new ReportEngine();
      let fileUrl = "";

      // Only generate file if it's not a direct print
      if (input.format !== "print") {
        const result = await engine.generate(config);
        
        if (result) {
          // In a real app, upload result.buffer to S3/GCS here.
          // For local dev, we mock a URL.
          const fileName = `${input.name.replace(/\s+/g, '_')}_${Date.now()}.${result.ext}`;
          fileUrl = `https://kilimohub-mock.storage/exports/${fileName}`;
        }
      }

      // Save to archive
      const [insertResult] = await db.insert(generatedReports).values({
        farmId: input.farmId,
        name: input.name,
        moduleKeys: input.moduleKeys,
        filters: input.filters || null,
        format: input.format,
        fileUrl: fileUrl || null,
        generatedByUserId: ctx.user.id,
      });

      return {
        success: true,
        reportId: insertResult.insertId,
        fileUrl,
      };
    })
});
