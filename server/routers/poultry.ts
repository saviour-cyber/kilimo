import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  poultryFlocks,
  poultryEggProduction,
  poultryMortality,
  poultryHealthLogs,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const poultryRouter = router({
  // ── Flocks ────────────────────────────────────────────────────────────────────
  listFlocks: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(poultryFlocks).where(eq(poultryFlocks.farmId, input.farmId)).orderBy(desc(poultryFlocks.createdAt));
    }),

  createFlock: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      name: z.string().min(1),
      breed: z.string().optional(),
      birdType: z.string().min(1).default("layer"),
      quantity: z.number().min(0).default(0),
      housing: z.string().optional(),
      acquisitionDate: z.string().optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input };
      if (data.acquisitionDate) data.acquisitionDate = new Date(data.acquisitionDate);
      const [result] = await db.insert(poultryFlocks).values(data);
      return { flockId: (result as any).insertId };
    }),

  updateFlock: protectedProcedure
    .input(z.object({
      flockId: z.number(),
      farmId: z.number(),
      name: z.string().optional(),
      breed: z.string().optional(),
      birdType: z.string().optional(),
      quantity: z.number().optional(),
      housing: z.string().optional(),
      status: z.enum(["active", "sold", "culled", "transferred"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { flockId, farmId, ...data } = input;
      await db.update(poultryFlocks).set(data as any).where(and(eq(poultryFlocks.id, flockId), eq(poultryFlocks.farmId, farmId)));
      return { success: true };
    }),

  deleteFlock: protectedProcedure
    .input(z.object({ flockId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");
      await db.delete(poultryFlocks).where(and(eq(poultryFlocks.id, input.flockId), eq(poultryFlocks.farmId, input.farmId)));
      return { success: true };
    }),

  // ── Egg Production ────────────────────────────────────────────────────────────
  listEggProduction: protectedProcedure
    .input(z.object({ farmId: z.number(), flockId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(poultryEggProduction.farmId, input.farmId)];
      if (input.flockId) conditions.push(eq(poultryEggProduction.flockId, input.flockId));
      return db.select().from(poultryEggProduction).where(and(...conditions)).orderBy(desc(poultryEggProduction.date));
    }),

  createEggProduction: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      flockId: z.number(),
      date: z.string(),
      eggsCollected: z.number().min(0).default(0),
      damagedEggs: z.number().min(0).default(0),
      saleableEggs: z.number().min(0).default(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, date: new Date(input.date) };
      const [result] = await db.insert(poultryEggProduction).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Mortality ─────────────────────────────────────────────────────────────────
  listMortality: protectedProcedure
    .input(z.object({ farmId: z.number(), flockId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(poultryMortality.farmId, input.farmId)];
      if (input.flockId) conditions.push(eq(poultryMortality.flockId, input.flockId));
      return db.select().from(poultryMortality).where(and(...conditions)).orderBy(desc(poultryMortality.date));
    }),

  createMortality: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      flockId: z.number(),
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
      const [result] = await db.insert(poultryMortality).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Health Logs ───────────────────────────────────────────────────────────────
  listHealthLogs: protectedProcedure
    .input(z.object({ farmId: z.number(), flockId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(poultryHealthLogs.farmId, input.farmId)];
      if (input.flockId) conditions.push(eq(poultryHealthLogs.flockId, input.flockId));
      return db.select().from(poultryHealthLogs).where(and(...conditions)).orderBy(desc(poultryHealthLogs.date));
    }),

  createHealthLog: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      flockId: z.number(),
      date: z.string(),
      condition: z.string().optional(),
      affectedQuantity: z.number().optional(),
      treatment: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, date: new Date(input.date) };
      const [result] = await db.insert(poultryHealthLogs).values(data);
      return { id: (result as any).insertId };
    }),
});
