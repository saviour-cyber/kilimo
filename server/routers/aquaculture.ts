import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  aquaProductionUnits,
  aquaStocking,
  aquaWaterQuality,
  aquaHarvests,
  aquaGrowthLogs,
  aquaMortality,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const aquacultureRouter = router({
  // ── Production Units ─────────────────────────────────────────────────────────
  listUnits: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(aquaProductionUnits).where(eq(aquaProductionUnits.farmId, input.farmId)).orderBy(desc(aquaProductionUnits.createdAt));
    }),

  createUnit: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      identifier: z.string().min(1),
      unitType: z.enum(["pond", "tank", "cage", "raceway"]),
      capacityLiters: z.string().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const [result] = await db.insert(aquaProductionUnits).values(input);
      return { unitId: (result as any).insertId };
    }),

  updateUnit: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      farmId: z.number(),
      identifier: z.string().optional(),
      unitType: z.enum(["pond", "tank", "cage", "raceway"]).optional(),
      status: z.enum(["active", "inactive", "maintenance"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { unitId, farmId, ...data } = input;
      await db.update(aquaProductionUnits).set(data as any).where(and(eq(aquaProductionUnits.id, unitId), eq(aquaProductionUnits.farmId, farmId)));
      return { success: true };
    }),

  // ── Stocking ──────────────────────────────────────────────────────────────────
  listStocking: protectedProcedure
    .input(z.object({ farmId: z.number(), unitId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(aquaStocking.farmId, input.farmId)];
      if (input.unitId) conditions.push(eq(aquaStocking.unitId, input.unitId));
      return db.select().from(aquaStocking).where(and(...conditions)).orderBy(desc(aquaStocking.stockingDate));
    }),

  createStocking: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      unitId: z.number(),
      species: z.string().min(1),
      quantity: z.number().min(1),
      stockingDate: z.string(),
      source: z.string().optional(),
      initialWeightG: z.string().optional(),
      costPerUnit: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, stockingDate: new Date(input.stockingDate) };
      const [result] = await db.insert(aquaStocking).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Water Quality ─────────────────────────────────────────────────────────────
  listWaterQuality: protectedProcedure
    .input(z.object({ farmId: z.number(), unitId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(aquaWaterQuality.farmId, input.farmId)];
      if (input.unitId) conditions.push(eq(aquaWaterQuality.unitId, input.unitId));
      return db.select().from(aquaWaterQuality).where(and(...conditions)).orderBy(desc(aquaWaterQuality.measurementDate));
    }),

  createWaterQuality: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      unitId: z.number(),
      measurementDate: z.string(),
      temperature: z.string().optional(),
      pH: z.string().optional(),
      dissolvedOxygen: z.string().optional(),
      ammonia: z.string().optional(),
      nitrite: z.string().optional(),
      salinity: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, measurementDate: new Date(input.measurementDate) };
      const [result] = await db.insert(aquaWaterQuality).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Harvests ──────────────────────────────────────────────────────────────────
  listHarvests: protectedProcedure
    .input(z.object({ farmId: z.number(), unitId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(aquaHarvests.farmId, input.farmId)];
      if (input.unitId) conditions.push(eq(aquaHarvests.unitId, input.unitId));
      return db.select().from(aquaHarvests).where(and(...conditions)).orderBy(desc(aquaHarvests.harvestDate));
    }),

  createHarvest: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      unitId: z.number(),
      species: z.string().optional(),
      harvestDate: z.string(),
      quantity: z.number().optional(),
      totalWeightKg: z.string().optional(),
      averageWeightG: z.string().optional(),
      grade: z.string().optional(),
      destination: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, harvestDate: new Date(input.harvestDate) };
      const [result] = await db.insert(aquaHarvests).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Growth Logs ───────────────────────────────────────────────────────────────
  listGrowthLogs: protectedProcedure
    .input(z.object({ farmId: z.number(), unitId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(aquaGrowthLogs.farmId, input.farmId)];
      if (input.unitId) conditions.push(eq(aquaGrowthLogs.unitId, input.unitId));
      return db.select().from(aquaGrowthLogs).where(and(...conditions)).orderBy(desc(aquaGrowthLogs.logDate));
    }),

  createGrowthLog: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      unitId: z.number(),
      species: z.string().optional(),
      logDate: z.string(),
      sampleSize: z.number().optional(),
      averageWeightG: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, logDate: new Date(input.logDate) };
      const [result] = await db.insert(aquaGrowthLogs).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Mortality ─────────────────────────────────────────────────────────────────
  listMortality: protectedProcedure
    .input(z.object({ farmId: z.number(), unitId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(aquaMortality.farmId, input.farmId)];
      if (input.unitId) conditions.push(eq(aquaMortality.unitId, input.unitId));
      return db.select().from(aquaMortality).where(and(...conditions)).orderBy(desc(aquaMortality.date));
    }),

  createMortality: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      unitId: z.number(),
      species: z.string().optional(),
      date: z.string(),
      quantity: z.number().min(1),
      suspectedCause: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, date: new Date(input.date) };
      const [result] = await db.insert(aquaMortality).values(data);
      return { id: (result as any).insertId };
    }),
});
