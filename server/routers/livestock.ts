import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { animals, breedingRecords, feedRecords, healthLogs, mortalityRecords, productionRecords } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const livestockRouter = router({
  // ── Animals ──────────────────────────────────────────────────────────────────
  listAnimals: protectedProcedure
    .input(z.object({ farmId: z.number(), status: z.string().optional(), species: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(animals.farmId, input.farmId)];
      if (input.status) conditions.push(eq(animals.status, input.status as any));
      if (input.species) conditions.push(eq(animals.species, input.species));
      return db.select().from(animals).where(and(...conditions)).orderBy(desc(animals.createdAt));
    }),

  getAnimal: protectedProcedure
    .input(z.object({ animalId: z.number(), farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const [animal] = await db.select().from(animals).where(and(eq(animals.id, input.animalId), eq(animals.farmId, input.farmId))).limit(1);
      if (!animal) throw new TRPCError({ code: "NOT_FOUND" });
      return animal;
    }),

  createAnimal: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      tagNumber: z.string().optional(),
      name: z.string().optional(),
      species: z.string().min(1),
      breed: z.string().optional(),
      gender: z.enum(["male", "female", "unknown"]).optional(),
      dateOfBirth: z.string().optional(),
      acquisitionDate: z.string().optional(),
      acquisitionType: z.enum(["born", "purchased", "donated", "other"]).optional(),
      weight: z.string().optional(),
      weightUnit: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input };
      if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
      if (data.acquisitionDate) data.acquisitionDate = new Date(data.acquisitionDate);
      const [result] = await db.insert(animals).values(data);
      return { animalId: (result as any).insertId };
    }),

  updateAnimal: protectedProcedure
    .input(z.object({
      animalId: z.number(),
      farmId: z.number(),
      tagNumber: z.string().optional(),
      name: z.string().optional(),
      species: z.string().optional(),
      breed: z.string().optional(),
      gender: z.enum(["male", "female", "unknown"]).optional(),
      status: z.enum(["active", "sold", "deceased", "transferred"]).optional(),
      weight: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { animalId, farmId, ...data } = input;
      await db.update(animals).set(data as any).where(and(eq(animals.id, animalId), eq(animals.farmId, farmId)));
      return { success: true };
    }),

  // ── Breeding ─────────────────────────────────────────────────────────────────
  listBreeding: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(breedingRecords).where(eq(breedingRecords.farmId, input.farmId)).orderBy(desc(breedingRecords.breedingDate));
    }),

  createBreeding: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      damId: z.number(),
      sireId: z.number().optional(),
      sireDescription: z.string().optional(),
      breedingDate: z.string(),
      expectedDeliveryDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input };
      if (data.breedingDate) data.breedingDate = new Date(data.breedingDate);
      if (data.expectedDeliveryDate) data.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
      const [result] = await db.insert(breedingRecords).values(data);
      return { breedingId: (result as any).insertId };
    }),

  updateBreeding: protectedProcedure
    .input(z.object({
      breedingId: z.number(),
      farmId: z.number(),
      outcome: z.enum(["pending", "successful", "failed", "aborted"]).optional(),
      actualDeliveryDate: z.string().optional(),
      offspringCount: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { breedingId, farmId, ...rawData } = input;
      const data: any = { ...rawData };
      if (data.actualDeliveryDate) data.actualDeliveryDate = new Date(data.actualDeliveryDate);
      await db.update(breedingRecords).set(data).where(and(eq(breedingRecords.id, breedingId), eq(breedingRecords.farmId, farmId)));
      return { success: true };
    }),

  // ── Health Logs ───────────────────────────────────────────────────────────────
  listHealthLogs: protectedProcedure
    .input(z.object({ farmId: z.number(), animalId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(healthLogs.farmId, input.farmId)];
      if (input.animalId) conditions.push(eq(healthLogs.animalId, input.animalId));
      return db.select().from(healthLogs).where(and(...conditions)).orderBy(desc(healthLogs.performedDate));
    }),

  createHealthLog: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      animalId: z.number().optional(),
      logType: z.enum(["vaccination", "treatment", "checkup", "surgery", "weight", "other"]),
      title: z.string().min(1).max(128),
      description: z.string().optional(),
      performedDate: z.string(),
      nextDueDate: z.string().optional(),
      performedBy: z.string().optional(),
      cost: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, recordedByUserId: ctx.user.id };
      if (data.performedDate) data.performedDate = new Date(data.performedDate);
      if (data.nextDueDate) data.nextDueDate = new Date(data.nextDueDate);
      const [result] = await db.insert(healthLogs).values(data);
      return { logId: (result as any).insertId };
    }),

  // ── Feed Records ──────────────────────────────────────────────────────────────
  listFeedRecords: protectedProcedure
    .input(z.object({ farmId: z.number(), animalId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(feedRecords.farmId, input.farmId)];
      if (input.animalId) conditions.push(eq(feedRecords.animalId, input.animalId));
      return db.select().from(feedRecords).where(and(...conditions)).orderBy(desc(feedRecords.feedDate));
    }),

  createFeedRecord: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      animalId: z.number().optional(),
      feedType: z.string().min(1),
      quantity: z.string(),
      unit: z.string().optional(),
      feedDate: z.string(),
      cost: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, recordedByUserId: ctx.user.id };
      if (data.feedDate) data.feedDate = new Date(data.feedDate);
      const [result] = await db.insert(feedRecords).values(data);
      return { recordId: (result as any).insertId };
    }),

  // ── Production Records ────────────────────────────────────────────────────────
  listProduction: protectedProcedure
    .input(z.object({ farmId: z.number(), productType: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(productionRecords.farmId, input.farmId)];
      if (input.productType) conditions.push(eq(productionRecords.productType, input.productType as any));
      return db.select().from(productionRecords).where(and(...conditions)).orderBy(desc(productionRecords.recordDate));
    }),

  createProduction: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      animalId: z.number().optional(),
      productType: z.enum(["milk", "eggs", "wool", "honey", "other"]),
      quantity: z.string(),
      unit: z.string().optional(),
      recordDate: z.string(),
      quality: z.enum(["excellent", "good", "fair", "poor"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, recordedByUserId: ctx.user.id };
      if (data.recordDate) data.recordDate = new Date(data.recordDate);
      const [result] = await db.insert(productionRecords).values(data);
      return { recordId: (result as any).insertId };
    }),

  // ── Mortality Records ─────────────────────────────────────────────────────────
  listMortality: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(mortalityRecords).where(eq(mortalityRecords.farmId, input.farmId)).orderBy(desc(mortalityRecords.deathDate));
    }),

  createMortality: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      animalId: z.number(),
      deathDate: z.string(),
      cause: z.string().optional(),
      causeCategory: z.enum(["disease", "injury", "natural", "predator", "unknown", "other"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, recordedByUserId: ctx.user.id };
      if (data.deathDate) data.deathDate = new Date(data.deathDate);
      const [result] = await db.insert(mortalityRecords).values(data);
      // Update animal status to deceased
      await db.update(animals).set({ status: "deceased" }).where(and(eq(animals.id, input.animalId), eq(animals.farmId, input.farmId)));
      return { recordId: (result as any).insertId };
    }),

  // ── Analytics ─────────────────────────────────────────────────────────────────
  productionAnalytics: protectedProcedure
    .input(z.object({ farmId: z.number(), productType: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(productionRecords.farmId, input.farmId)];
      if (input.productType) conditions.push(eq(productionRecords.productType, input.productType as any));
      const records = await db.select().from(productionRecords).where(and(...conditions)).orderBy(productionRecords.recordDate);
      const byMonth: Record<string, { month: string; total: number; count: number }> = {};
      for (const r of records) {
        const month = String(r.recordDate).slice(0, 7);
        if (!byMonth[month]) byMonth[month] = { month, total: 0, count: 0 };
        byMonth[month].total += parseFloat(String(r.quantity)) || 0;
        byMonth[month].count += 1;
      }
      return Object.values(byMonth);
    }),

  // ── Dashboard Summary ─────────────────────────────────────────────────────────
  dashboardSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const [allAnimals, recentHealth, recentMortality] = await Promise.all([
        db.select().from(animals).where(eq(animals.farmId, input.farmId)),
        db.select().from(healthLogs).where(eq(healthLogs.farmId, input.farmId)).orderBy(desc(healthLogs.performedDate)).limit(3),
        db.select().from(mortalityRecords).where(eq(mortalityRecords.farmId, input.farmId)).orderBy(desc(mortalityRecords.deathDate)).limit(3),
      ]);

      const activeAnimals = allAnimals.filter(a => a.status === "active");
      const speciesCounts: Record<string, number> = {};
      for (const a of activeAnimals) {
        speciesCounts[a.species] = (speciesCounts[a.species] || 0) + 1;
      }

      return {
        activeAnimals: activeAnimals.length,
        totalAnimals: allAnimals.length,
        speciesBreakdown: Object.entries(speciesCounts).map(([species, count]) => ({ species, count })),
        recentHealthLogs: recentHealth.map(h => ({
          id: h.id,
          title: h.title,
          logType: h.logType,
          performedDate: String(h.performedDate).slice(0, 10),
        })),
        recentMortality: recentMortality.length,
      };
    }),
});
