import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { cropIncidents, cropPlantings, fields, harvestLogs } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const cropsRouter = router({
  // ── Fields ──────────────────────────────────────────────────────────────────
  listFields: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(fields).where(and(eq(fields.farmId, input.farmId), eq(fields.isArchived, false)));
    }),

  createField: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      name: z.string().min(1).max(128),
      sizeHectares: z.string().optional(),
      soilType: z.string().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const [result] = await db.insert(fields).values(input);
      return { fieldId: (result as any).insertId };
    }),

  updateField: protectedProcedure
    .input(z.object({
      fieldId: z.number(),
      farmId: z.number(),
      name: z.string().optional(),
      sizeHectares: z.string().optional(),
      soilType: z.string().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { fieldId, farmId, ...data } = input;
      await db.update(fields).set(data).where(and(eq(fields.id, fieldId), eq(fields.farmId, farmId)));
      return { success: true };
    }),

  archiveField: protectedProcedure
    .input(z.object({ fieldId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");
      await db.update(fields).set({ isArchived: true }).where(and(eq(fields.id, input.fieldId), eq(fields.farmId, input.farmId)));
      return { success: true };
    }),

  // ── Plantings ────────────────────────────────────────────────────────────────
  listPlantings: protectedProcedure
    .input(z.object({ farmId: z.number(), status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions = [eq(cropPlantings.farmId, input.farmId)];
      if (input.status) conditions.push(eq(cropPlantings.status, input.status as any));
      return db.select().from(cropPlantings).where(and(...conditions)).orderBy(desc(cropPlantings.plantingDate));
    }),

  createPlanting: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      fieldId: z.number().optional(),
      cropName: z.string().min(1).max(128),
      variety: z.string().optional(),
      plantingDate: z.string(),
      expectedHarvestDate: z.string().optional(),
      quantityPlanted: z.string().optional(),
      quantityUnit: z.string().optional(),
      season: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const insertData: any = { ...input, createdByUserId: ctx.user.id };
      if (insertData.plantingDate) insertData.plantingDate = new Date(insertData.plantingDate);
      if (insertData.expectedHarvestDate) insertData.expectedHarvestDate = new Date(insertData.expectedHarvestDate);
      const [result] = await db.insert(cropPlantings).values(insertData);
      return { plantingId: (result as any).insertId };
    }),

  updatePlanting: protectedProcedure
    .input(z.object({
      plantingId: z.number(),
      farmId: z.number(),
      cropName: z.string().optional(),
      variety: z.string().optional(),
      plantingDate: z.string().optional(),
      expectedHarvestDate: z.string().optional(),
      actualHarvestDate: z.string().optional(),
      quantityPlanted: z.string().optional(),
      quantityUnit: z.string().optional(),
      growthStage: z.enum(["seedling", "vegetative", "flowering", "fruiting", "harvest_ready", "harvested", "failed"]).optional(),
      status: z.enum(["active", "completed", "failed", "archived"]).optional(),
      season: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { plantingId, farmId, ...rawUpdate } = input;
      const updateData: any = { ...rawUpdate };
      if (updateData.plantingDate) updateData.plantingDate = new Date(updateData.plantingDate);
      if (updateData.expectedHarvestDate) updateData.expectedHarvestDate = new Date(updateData.expectedHarvestDate);
      if (updateData.actualHarvestDate) updateData.actualHarvestDate = new Date(updateData.actualHarvestDate);
      await db.update(cropPlantings).set(updateData).where(and(eq(cropPlantings.id, plantingId), eq(cropPlantings.farmId, farmId)));
      return { success: true };
    }),

  deletePlanting: protectedProcedure
    .input(z.object({ plantingId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");
      await db.update(cropPlantings).set({ status: "archived" }).where(and(eq(cropPlantings.id, input.plantingId), eq(cropPlantings.farmId, input.farmId)));
      return { success: true };
    }),

  // ── Harvest Logs ─────────────────────────────────────────────────────────────
  listHarvests: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(harvestLogs).where(eq(harvestLogs.farmId, input.farmId)).orderBy(desc(harvestLogs.harvestDate));
    }),

  createHarvest: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      plantingId: z.number().optional(),
      fieldId: z.number().optional(),
      cropName: z.string().min(1),
      harvestDate: z.string(),
      yieldAmount: z.string(),
      yieldUnit: z.string().optional(),
      quality: z.enum(["excellent", "good", "fair", "poor"]).optional(),
      soldAmount: z.string().optional(),
      pricePerUnit: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const harvestData: any = { ...input, recordedByUserId: ctx.user.id };
      if (harvestData.harvestDate) harvestData.harvestDate = new Date(harvestData.harvestDate);
      const [result] = await db.insert(harvestLogs).values(harvestData);
      return { harvestId: (result as any).insertId };
    }),

  deleteHarvest: protectedProcedure
    .input(z.object({ harvestId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");
      await db.delete(harvestLogs).where(and(eq(harvestLogs.id, input.harvestId), eq(harvestLogs.farmId, input.farmId)));
      return { success: true };
    }),

  // ── Incidents ─────────────────────────────────────────────────────────────────
  listIncidents: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(cropIncidents).where(eq(cropIncidents.farmId, input.farmId)).orderBy(desc(cropIncidents.detectedDate));
    }),

  createIncident: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      plantingId: z.number().optional(),
      fieldId: z.number().optional(),
      incidentType: z.enum(["disease", "pest", "weather", "other"]),
      name: z.string().min(1).max(128),
      severity: z.enum(["low", "medium", "high", "critical"]),
      detectedDate: z.string(),
      treatment: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const incidentData: any = { ...input, reportedByUserId: ctx.user.id };
      if (incidentData.detectedDate) incidentData.detectedDate = new Date(incidentData.detectedDate);
      const [result] = await db.insert(cropIncidents).values(incidentData);
      return { incidentId: (result as any).insertId };
    }),

  updateIncident: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      farmId: z.number(),
      status: z.enum(["active", "treated", "resolved", "monitoring"]).optional(),
      resolvedDate: z.string().optional(),
      treatment: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { incidentId, farmId, ...rawData } = input;
      const data: Record<string, unknown> = {};
      if (rawData.status !== undefined) data.status = rawData.status;
      if (rawData.resolvedDate !== undefined) data.resolvedDate = rawData.resolvedDate ? new Date(rawData.resolvedDate) : null;
      if (rawData.treatment !== undefined) data.treatment = rawData.treatment;
      if (rawData.notes !== undefined) data.notes = rawData.notes;
      await db.update(cropIncidents).set(data as any).where(and(eq(cropIncidents.id, incidentId), eq(cropIncidents.farmId, farmId)));
      return { success: true };
    }),

  // ── Dashboard Summary ─────────────────────────────────────────────────────────
  dashboardSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const [activePlantings, fields_, recentHarvests, activeIncidents] = await Promise.all([
        db.select().from(cropPlantings).where(and(eq(cropPlantings.farmId, input.farmId), eq(cropPlantings.status, "active"))),
        db.select().from(fields).where(and(eq(fields.farmId, input.farmId), eq(fields.isArchived, false))),
        db.select().from(harvestLogs).where(eq(harvestLogs.farmId, input.farmId)).orderBy(desc(harvestLogs.harvestDate)).limit(3),
        db.select().from(cropIncidents).where(and(eq(cropIncidents.farmId, input.farmId), eq(cropIncidents.status, "active"))),
      ]);

      return {
        activeCrops: activePlantings.length,
        totalFields: fields_.length,
        recentHarvests: recentHarvests.map(h => ({
          id: h.id,
          cropName: h.cropName,
          yieldAmount: String(h.yieldAmount),
          yieldUnit: h.yieldUnit,
          harvestDate: String(h.harvestDate).slice(0, 10),
        })),
        activeIncidents: activeIncidents.length,
        incidentAlerts: activeIncidents.map(i => ({
          id: i.id,
          name: i.name,
          severity: i.severity,
          incidentType: i.incidentType,
        })),
      };
    }),
});

