import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  beeApiaries,
  beeHives,
  beeQueens,
  beeInspections,
  beeHarvests,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const beekeepingRouter = router({
  // ── Apiaries ──────────────────────────────────────────────────────────────────
  listApiaries: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(beeApiaries).where(eq(beeApiaries.farmId, input.farmId)).orderBy(desc(beeApiaries.createdAt));
    }),

  createApiary: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      name: z.string().min(1),
      location: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const [result] = await db.insert(beeApiaries).values(input);
      return { apiaryId: (result as any).insertId };
    }),

  updateApiary: protectedProcedure
    .input(z.object({
      apiaryId: z.number(),
      farmId: z.number(),
      name: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(["active", "inactive"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { apiaryId, farmId, ...data } = input;
      await db.update(beeApiaries).set(data as any).where(and(eq(beeApiaries.id, apiaryId), eq(beeApiaries.farmId, farmId)));
      return { success: true };
    }),

  // ── Hives ─────────────────────────────────────────────────────────────────────
  listHives: protectedProcedure
    .input(z.object({ farmId: z.number(), apiaryId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(beeHives.farmId, input.farmId)];
      if (input.apiaryId) conditions.push(eq(beeHives.apiaryId, input.apiaryId));
      return db.select().from(beeHives).where(and(...conditions)).orderBy(desc(beeHives.createdAt));
    }),

  createHive: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      apiaryId: z.number(),
      identifier: z.string().min(1),
      hiveType: z.string().optional(),
      colonyStatus: z.enum(["strong", "moderate", "weak", "empty", "dead"]).optional(),
      installationDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input };
      if (data.installationDate) data.installationDate = new Date(data.installationDate);
      const [result] = await db.insert(beeHives).values(data);
      return { hiveId: (result as any).insertId };
    }),

  updateHive: protectedProcedure
    .input(z.object({
      hiveId: z.number(),
      farmId: z.number(),
      identifier: z.string().optional(),
      hiveType: z.string().optional(),
      colonyStatus: z.enum(["strong", "moderate", "weak", "empty", "dead"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { hiveId, farmId, ...data } = input;
      await db.update(beeHives).set(data as any).where(and(eq(beeHives.id, hiveId), eq(beeHives.farmId, farmId)));
      return { success: true };
    }),

  // ── Queens ────────────────────────────────────────────────────────────────────
  listQueens: protectedProcedure
    .input(z.object({ farmId: z.number(), hiveId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(beeQueens.farmId, input.farmId)];
      if (input.hiveId) conditions.push(eq(beeQueens.hiveId, input.hiveId));
      return db.select().from(beeQueens).where(and(...conditions)).orderBy(desc(beeQueens.createdAt));
    }),

  createQueen: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      hiveId: z.number(),
      introductionDate: z.string().optional(),
      origin: z.string().optional(),
      status: z.enum(["present", "missing", "replaced", "dead"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input };
      if (data.introductionDate) data.introductionDate = new Date(data.introductionDate);
      const [result] = await db.insert(beeQueens).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Inspections ───────────────────────────────────────────────────────────────
  listInspections: protectedProcedure
    .input(z.object({ farmId: z.number(), hiveId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(beeInspections.farmId, input.farmId)];
      if (input.hiveId) conditions.push(eq(beeInspections.hiveId, input.hiveId));
      return db.select().from(beeInspections).where(and(...conditions)).orderBy(desc(beeInspections.date));
    }),

  createInspection: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      hiveId: z.number(),
      date: z.string(),
      colonyStrength: z.enum(["strong", "moderate", "weak"]).optional(),
      queenObserved: z.boolean().optional(),
      honeyStores: z.string().optional(),
      pestsDiseases: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, date: new Date(input.date) };
      const [result] = await db.insert(beeInspections).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Harvests ──────────────────────────────────────────────────────────────────
  listHarvests: protectedProcedure
    .input(z.object({ farmId: z.number(), apiaryId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(beeHarvests.farmId, input.farmId)];
      if (input.apiaryId) conditions.push(eq(beeHarvests.apiaryId, input.apiaryId));
      return db.select().from(beeHarvests).where(and(...conditions)).orderBy(desc(beeHarvests.harvestDate));
    }),

  createHarvest: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      apiaryId: z.number(),
      hiveId: z.number().optional(),
      harvestDate: z.string(),
      quantityKg: z.string().optional(),
      qualityGrade: z.string().optional(),
      storageDestination: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, harvestDate: new Date(input.harvestDate) };
      const [result] = await db.insert(beeHarvests).values(data);
      return { id: (result as any).insertId };
    }),
});
