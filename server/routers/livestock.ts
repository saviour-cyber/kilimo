import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  animalHeatLogs,
  animalHerds,
  animalMovements,
  animals,
  breedingRecords,
  feedRecords,
  healthLogs,
  mortalityRecords,
  productionRecords,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const livestockRouter = router({
  // ── Animals (Core Domain Entity) ─────────────────────────────────────────────
  listAnimals: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        status: z.string().optional(),
        species: z.string().optional(),
        isDairy: z.boolean().optional(),
        herdId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(animals.farmId, input.farmId)];
      if (input.status) conditions.push(eq(animals.status, input.status as any));
      if (input.species) conditions.push(eq(animals.species, input.species));
      if (input.isDairy !== undefined) conditions.push(eq(animals.isDairy, input.isDairy));
      if (input.herdId !== undefined) conditions.push(eq(animals.herdId, input.herdId));
      return db.select().from(animals).where(and(...conditions)).orderBy(desc(animals.createdAt));
    }),

  getAnimal: protectedProcedure
    .input(z.object({ animalId: z.number(), farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const [animal] = await db
        .select()
        .from(animals)
        .where(and(eq(animals.id, input.animalId), eq(animals.farmId, input.farmId)))
        .limit(1);
      if (!animal) throw new TRPCError({ code: "NOT_FOUND" });
      return animal;
    }),

  createAnimal: protectedProcedure
    .input(
      z.object({
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
        // Core extension fields
        isDairy: z.boolean().optional(),
        herdId: z.number().nullable().optional(),
        bodyConditionScore: z.string().optional(),
        currentLocation: z.string().optional(),
        lactationStage: z.enum(["non_lactating", "early", "mid", "late", "dry"]).optional(),
        isQuarantined: z.boolean().optional(),
        quarantineReason: z.string().optional(),
        quarantineUntil: z.string().optional(),
        purchasePrice: z.string().optional(),
        purchaseDate: z.string().optional(),
        sellerInfo: z.string().optional(),
        salePrice: z.string().optional(),
        saleDate: z.string().optional(),
        buyerInfo: z.string().optional(),
        saleWeight: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input };
      if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
      if (data.acquisitionDate) data.acquisitionDate = new Date(data.acquisitionDate);
      if (data.quarantineUntil) data.quarantineUntil = new Date(data.quarantineUntil);
      if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
      if (data.saleDate) data.saleDate = new Date(data.saleDate);
      const [result] = await db.insert(animals).values(data);
      return { animalId: (result as any).insertId };
    }),

  updateAnimal: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        farmId: z.number(),
        tagNumber: z.string().optional(),
        name: z.string().optional(),
        species: z.string().optional(),
        breed: z.string().optional(),
        gender: z.enum(["male", "female", "unknown"]).optional(),
        status: z.enum(["active", "sold", "deceased", "transferred"]).optional(),
        weight: z.string().optional(),
        weightUnit: z.string().optional(),
        notes: z.string().optional(),
        // Core extension fields
        isDairy: z.boolean().optional(),
        herdId: z.number().nullable().optional(),
        bodyConditionScore: z.string().optional(),
        currentLocation: z.string().optional(),
        lactationStage: z.enum(["non_lactating", "early", "mid", "late", "dry"]).optional(),
        isQuarantined: z.boolean().optional(),
        quarantineReason: z.string().optional(),
        quarantineUntil: z.string().optional(),
        purchasePrice: z.string().optional(),
        purchaseDate: z.string().optional(),
        sellerInfo: z.string().optional(),
        salePrice: z.string().optional(),
        saleDate: z.string().optional(),
        buyerInfo: z.string().optional(),
        saleWeight: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { animalId, farmId, ...raw } = input;
      const data: any = { ...raw };
      if (data.quarantineUntil) data.quarantineUntil = new Date(data.quarantineUntil);
      if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
      if (data.saleDate) data.saleDate = new Date(data.saleDate);
      await db.update(animals).set(data).where(and(eq(animals.id, animalId), eq(animals.farmId, farmId)));
      return { success: true };
    }),

  // ── Herds & Groups ───────────────────────────────────────────────────────────
  listHerds: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const herds = await db
        .select()
        .from(animalHerds)
        .where(eq(animalHerds.farmId, input.farmId))
        .orderBy(desc(animalHerds.createdAt));

      const farmAnimals = await db
        .select({ id: animals.id, herdId: animals.herdId, status: animals.status })
        .from(animals)
        .where(and(eq(animals.farmId, input.farmId), eq(animals.status, "active")));

      const counts: Record<number, number> = {};
      for (const a of farmAnimals) {
        if (a.herdId) {
          counts[a.herdId] = (counts[a.herdId] || 0) + 1;
        }
      }

      return herds.map((h) => ({
        ...h,
        currentHeadCount: counts[h.id] || 0,
      }));
    }),

  createHerd: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        name: z.string().min(1).max(128),
        code: z.string().max(64).optional(),
        purpose: z
          .enum([
            "general",
            "milking",
            "dry",
            "calves",
            "heifers",
            "fattening",
            "quarantine",
            "pasture_group",
          ])
          .default("general"),
        location: z.string().max(255).optional(),
        targetHeadCount: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const [result] = await db.insert(animalHerds).values(input);
      return { herdId: (result as any).insertId };
    }),

  updateHerd: protectedProcedure
    .input(
      z.object({
        herdId: z.number(),
        farmId: z.number(),
        name: z.string().min(1).max(128).optional(),
        code: z.string().max(64).optional(),
        purpose: z
          .enum([
            "general",
            "milking",
            "dry",
            "calves",
            "heifers",
            "fattening",
            "quarantine",
            "pasture_group",
          ])
          .optional(),
        location: z.string().max(255).optional(),
        targetHeadCount: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { herdId, farmId, ...data } = input;
      await db
        .update(animalHerds)
        .set(data)
        .where(and(eq(animalHerds.id, herdId), eq(animalHerds.farmId, farmId)));
      return { success: true };
    }),

  deleteHerd: protectedProcedure
    .input(z.object({ herdId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");
      // Detach animals from herd first
      await db
        .update(animals)
        .set({ herdId: null })
        .where(and(eq(animals.herdId, input.herdId), eq(animals.farmId, input.farmId)));
      await db
        .delete(animalHerds)
        .where(and(eq(animalHerds.id, input.herdId), eq(animalHerds.farmId, input.farmId)));
      return { success: true };
    }),

  // ── Heat Detection Logs ──────────────────────────────────────────────────────
  listHeatLogs: protectedProcedure
    .input(z.object({ farmId: z.number(), animalId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(animalHeatLogs.farmId, input.farmId)];
      if (input.animalId) conditions.push(eq(animalHeatLogs.animalId, input.animalId));
      return db
        .select()
        .from(animalHeatLogs)
        .where(and(...conditions))
        .orderBy(desc(animalHeatLogs.observedDate));
    }),

  createHeatLog: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number(),
        observedDate: z.string(),
        observedTime: z.string().optional(),
        heatSigns: z.string().min(1),
        intensity: z.enum(["weak", "moderate", "strong"]).default("moderate"),
        breedingWindowStart: z.string().optional(),
        breedingWindowEnd: z.string().optional(),
        status: z.enum(["observed", "inseminated", "expired", "missed"]).default("observed"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = {
        ...input,
        recordedByUserId: ctx.user.id,
        observedDate: new Date(input.observedDate),
        breedingWindowStart: input.breedingWindowStart ? new Date(input.breedingWindowStart) : undefined,
        breedingWindowEnd: input.breedingWindowEnd ? new Date(input.breedingWindowEnd) : undefined,
      };
      const [result] = await db.insert(animalHeatLogs).values(data);
      return { heatLogId: (result as any).insertId };
    }),

  updateHeatLog: protectedProcedure
    .input(
      z.object({
        heatLogId: z.number(),
        farmId: z.number(),
        status: z.enum(["observed", "inseminated", "expired", "missed"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { heatLogId, farmId, ...data } = input;
      await db
        .update(animalHeatLogs)
        .set(data)
        .where(and(eq(animalHeatLogs.id, heatLogId), eq(animalHeatLogs.farmId, farmId)));
      return { success: true };
    }),

  // ── Movements / Pasture Transfers ───────────────────────────────────────────
  listMovements: protectedProcedure
    .input(z.object({ farmId: z.number(), animalId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(animalMovements.farmId, input.farmId)];
      if (input.animalId) conditions.push(eq(animalMovements.animalId, input.animalId));
      return db
        .select()
        .from(animalMovements)
        .where(and(...conditions))
        .orderBy(desc(animalMovements.movementDate));
    }),

  createMovement: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number(),
        fromLocation: z.string().optional(),
        toLocation: z.string().min(1),
        fromHerdId: z.number().optional(),
        toHerdId: z.number().optional(),
        movementDate: z.string(),
        reason: z.enum([
          "pasture_rotation",
          "quarantine",
          "weaning",
          "maternity",
          "treatment",
          "housing_change",
          "sale",
          "other",
        ]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = {
        ...input,
        recordedByUserId: ctx.user.id,
        movementDate: new Date(input.movementDate),
      };
      const [result] = await db.insert(animalMovements).values(data);

      // Update animal's current location and herd assignment
      const animalUpdates: any = {
        currentLocation: input.toLocation,
      };
      if (input.toHerdId !== undefined) {
        animalUpdates.herdId = input.toHerdId;
      }
      if (input.reason === "quarantine") {
        animalUpdates.isQuarantined = true;
      }
      await db
        .update(animals)
        .set(animalUpdates)
        .where(and(eq(animals.id, input.animalId), eq(animals.farmId, input.farmId)));

      return { movementId: (result as any).insertId };
    }),

  // ── Breeding & Gestation ─────────────────────────────────────────────────────
  listBreeding: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db
        .select()
        .from(breedingRecords)
        .where(eq(breedingRecords.farmId, input.farmId))
        .orderBy(desc(breedingRecords.breedingDate));
    }),

  listPregnancies: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db
        .select()
        .from(breedingRecords)
        .where(
          and(
            eq(breedingRecords.farmId, input.farmId),
            inArray(breedingRecords.pregnancyStatus, ["pending", "confirmed"])
          )
        )
        .orderBy(breedingRecords.expectedDeliveryDate);
    }),

  createBreeding: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        damId: z.number(),
        sireId: z.number().optional(),
        sireDescription: z.string().optional(),
        breedingDate: z.string(),
        breedingMethod: z
          .enum(["natural", "artificial_insemination", "embryo_transfer"])
          .default("natural"),
        gestationDays: z.number().default(283),
        pregnancyStatus: z
          .enum(["pending", "confirmed", "open", "delivered", "failed"])
          .default("pending"),
        expectedDeliveryDate: z.string().optional(),
        dryOffDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input };
      if (data.breedingDate) data.breedingDate = new Date(data.breedingDate);
      if (data.expectedDeliveryDate) data.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
      if (data.dryOffDate) data.dryOffDate = new Date(data.dryOffDate);
      const [result] = await db.insert(breedingRecords).values(data);
      return { breedingId: (result as any).insertId };
    }),

  updateBreeding: protectedProcedure
    .input(
      z.object({
        breedingId: z.number(),
        farmId: z.number(),
        pregnancyStatus: z
          .enum(["pending", "confirmed", "open", "delivered", "failed"])
          .optional(),
        confirmedDate: z.string().optional(),
        dryOffDate: z.string().optional(),
        outcome: z.enum(["pending", "successful", "failed", "aborted"]).optional(),
        actualDeliveryDate: z.string().optional(),
        offspringCount: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { breedingId, farmId, ...rawData } = input;
      const data: any = { ...rawData };
      if (data.confirmedDate) data.confirmedDate = new Date(data.confirmedDate);
      if (data.dryOffDate) data.dryOffDate = new Date(data.dryOffDate);
      if (data.actualDeliveryDate) data.actualDeliveryDate = new Date(data.actualDeliveryDate);
      await db
        .update(breedingRecords)
        .set(data)
        .where(and(eq(breedingRecords.id, breedingId), eq(breedingRecords.farmId, farmId)));
      return { success: true };
    }),

  // ── Health Logs with Advanced Intelligence ──────────────────────────────────
  listHealthLogs: protectedProcedure
    .input(z.object({ farmId: z.number(), animalId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(healthLogs.farmId, input.farmId)];
      if (input.animalId) conditions.push(eq(healthLogs.animalId, input.animalId));
      return db
        .select()
        .from(healthLogs)
        .where(and(...conditions))
        .orderBy(desc(healthLogs.performedDate));
    }),

  createHealthLog: protectedProcedure
    .input(
      z.object({
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
        // Intelligence fields
        bcsScore: z.string().optional(),
        meatWithdrawalDays: z.number().optional(),
        meatWithdrawalEndDate: z.string().optional(),
        milkWithdrawalDays: z.number().optional(),
        milkWithdrawalEndDate: z.string().optional(),
        isQuarantineRecommended: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, recordedByUserId: ctx.user.id };
      if (data.performedDate) data.performedDate = new Date(data.performedDate);
      if (data.nextDueDate) data.nextDueDate = new Date(data.nextDueDate);
      if (data.meatWithdrawalEndDate) data.meatWithdrawalEndDate = new Date(data.meatWithdrawalEndDate);
      if (data.milkWithdrawalEndDate) data.milkWithdrawalEndDate = new Date(data.milkWithdrawalEndDate);
      const [result] = await db.insert(healthLogs).values(data);

      // If animalId has bcsScore or quarantine recommendation, update animal
      if (input.animalId) {
        const animalUpdates: any = {};
        if (input.bcsScore) animalUpdates.bodyConditionScore = input.bcsScore;
        if (input.isQuarantineRecommended) {
          animalUpdates.isQuarantined = true;
          animalUpdates.quarantineReason = `Health log: ${input.title}`;
        }
        if (Object.keys(animalUpdates).length > 0) {
          await db
            .update(animals)
            .set(animalUpdates)
            .where(and(eq(animals.id, input.animalId), eq(animals.farmId, input.farmId)));
        }
      }

      return { logId: (result as any).insertId };
    }),

  // ── Feed Records ────────────────────────────────────────────────────────────
  listFeedRecords: protectedProcedure
    .input(z.object({ farmId: z.number(), animalId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(feedRecords.farmId, input.farmId)];
      if (input.animalId) conditions.push(eq(feedRecords.animalId, input.animalId));
      return db
        .select()
        .from(feedRecords)
        .where(and(...conditions))
        .orderBy(desc(feedRecords.feedDate));
    }),

  createFeedRecord: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number().optional(),
        feedType: z.string().min(1),
        quantity: z.string(),
        unit: z.string().optional(),
        feedDate: z.string(),
        cost: z.string().optional(),
        notes: z.string().optional(),
      })
    )
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

  // ── Production Records ──────────────────────────────────────────────────────
  listProduction: protectedProcedure
    .input(z.object({ farmId: z.number(), productType: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(productionRecords.farmId, input.farmId)];
      if (input.productType) conditions.push(eq(productionRecords.productType, input.productType as any));
      return db
        .select()
        .from(productionRecords)
        .where(and(...conditions))
        .orderBy(desc(productionRecords.recordDate));
    }),

  createProduction: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number().optional(),
        productType: z.enum(["milk", "eggs", "wool", "honey", "other"]),
        quantity: z.string(),
        unit: z.string().optional(),
        recordDate: z.string(),
        quality: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        notes: z.string().optional(),
      })
    )
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

  // ── Mortality Records ───────────────────────────────────────────────────────
  listMortality: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db
        .select()
        .from(mortalityRecords)
        .where(eq(mortalityRecords.farmId, input.farmId))
        .orderBy(desc(mortalityRecords.deathDate));
    }),

  createMortality: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number(),
        deathDate: z.string(),
        cause: z.string().optional(),
        causeCategory: z.enum(["disease", "injury", "natural", "predator", "unknown", "other"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, recordedByUserId: ctx.user.id };
      if (data.deathDate) data.deathDate = new Date(data.deathDate);
      const [result] = await db.insert(mortalityRecords).values(data);
      // Update animal status to deceased
      await db
        .update(animals)
        .set({ status: "deceased" })
        .where(and(eq(animals.id, input.animalId), eq(animals.farmId, input.farmId)));
      return { recordId: (result as any).insertId };
    }),

  // ── Analytics ───────────────────────────────────────────────────────────────
  productionAnalytics: protectedProcedure
    .input(z.object({ farmId: z.number(), productType: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(productionRecords.farmId, input.farmId)];
      if (input.productType) conditions.push(eq(productionRecords.productType, input.productType as any));
      const records = await db
        .select()
        .from(productionRecords)
        .where(and(...conditions))
        .orderBy(productionRecords.recordDate);
      const byMonth: Record<string, { month: string; total: number; count: number }> = {};
      for (const r of records) {
        const month = String(r.recordDate).slice(0, 7);
        if (!byMonth[month]) byMonth[month] = { month, total: 0, count: 0 };
        byMonth[month].total += parseFloat(String(r.quantity)) || 0;
        byMonth[month].count += 1;
      }
      return Object.values(byMonth);
    }),

  // ── Dashboard Summary ───────────────────────────────────────────────────────
  dashboardSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const [allAnimals, recentHealth, recentMortality, activeHerds] = await Promise.all([
        db.select().from(animals).where(eq(animals.farmId, input.farmId)),
        db
          .select()
          .from(healthLogs)
          .where(eq(healthLogs.farmId, input.farmId))
          .orderBy(desc(healthLogs.performedDate))
          .limit(3),
        db
          .select()
          .from(mortalityRecords)
          .where(eq(mortalityRecords.farmId, input.farmId))
          .orderBy(desc(mortalityRecords.deathDate))
          .limit(3),
        db.select().from(animalHerds).where(eq(animalHerds.farmId, input.farmId)),
      ]);

      const activeAnimals = allAnimals.filter((a) => a.status === "active");
      const speciesCounts: Record<string, number> = {};
      let quarantinedCount = 0;
      let dairyCount = 0;

      for (const a of activeAnimals) {
        speciesCounts[a.species] = (speciesCounts[a.species] || 0) + 1;
        if (a.isQuarantined) quarantinedCount++;
        if (a.isDairy) dairyCount++;
      }

      return {
        activeAnimals: activeAnimals.length,
        totalAnimals: allAnimals.length,
        dairyAnimals: dairyCount,
        quarantinedAnimals: quarantinedCount,
        herdsCount: activeHerds.length,
        speciesBreakdown: Object.entries(speciesCounts).map(([species, count]) => ({ species, count })),
        recentHealthLogs: recentHealth.map((h) => ({
          id: h.id,
          title: h.title,
          logType: h.logType,
          performedDate: String(h.performedDate).slice(0, 10),
        })),
        recentMortality: recentMortality.length,
      };
    }),
});
