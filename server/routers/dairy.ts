import { TRPCError } from "@trpc/server";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import {
  animals,
  dairyMilkProduction,
  dairyBreeding,
  dairyCalving,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const dairyRouter = router({
  // ── Animals (Integrated into Animal Core domain, no duplication) ──────────────
  listAnimals: protectedProcedure
    .input(z.object({ farmId: z.number(), status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [
        eq(animals.farmId, input.farmId),
        or(eq(animals.isDairy, true), eq(animals.species, "cattle")),
      ];
      if (input.status) conditions.push(eq(animals.status, input.status as any));
      return db
        .select()
        .from(animals)
        .where(and(...conditions))
        .orderBy(desc(animals.createdAt));
    }),

  createAnimal: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        name: z.string().optional(),
        tagNumber: z.string().optional(),
        breed: z.string().optional(),
        gender: z.enum(["male", "female"]).optional(),
        birthDate: z.string().optional(),
        acquisitionDate: z.string().optional(),
        acquisitionType: z.enum(["born", "purchased", "donated", "other"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = {
        farmId: input.farmId,
        name: input.name,
        tagNumber: input.tagNumber,
        breed: input.breed,
        gender: input.gender || "female",
        species: "cattle",
        isDairy: true,
        acquisitionType: input.acquisitionType || "born",
        notes: input.notes,
      };
      if (input.birthDate) data.dateOfBirth = new Date(input.birthDate);
      if (input.acquisitionDate) data.acquisitionDate = new Date(input.acquisitionDate);
      const [result] = await db.insert(animals).values(data);
      return { animalId: (result as any).insertId };
    }),

  updateAnimal: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        farmId: z.number(),
        name: z.string().optional(),
        tagNumber: z.string().optional(),
        breed: z.string().optional(),
        status: z.enum(["active", "sold", "deceased", "transferred"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { animalId, farmId, ...data } = input;
      await db
        .update(animals)
        .set(data as any)
        .where(and(eq(animals.id, animalId), eq(animals.farmId, farmId)));
      return { success: true };
    }),

  // ── Milk Production ───────────────────────────────────────────────────────────
  listMilkProduction: protectedProcedure
    .input(z.object({ farmId: z.number(), animalId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(dairyMilkProduction.farmId, input.farmId)];
      if (input.animalId) conditions.push(eq(dairyMilkProduction.animalId, input.animalId));
      return db
        .select()
        .from(dairyMilkProduction)
        .where(and(...conditions))
        .orderBy(desc(dairyMilkProduction.date));
    }),

  createMilkProduction: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number(),
        date: z.string(),
        morningVolume: z.string().optional(),
        eveningVolume: z.string().optional(),
        totalVolume: z.string().optional(),
        qualityNotes: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, date: new Date(input.date) };
      const [result] = await db.insert(dairyMilkProduction).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Breeding ──────────────────────────────────────────────────────────────────
  listBreeding: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db
        .select()
        .from(dairyBreeding)
        .where(eq(dairyBreeding.farmId, input.farmId))
        .orderBy(desc(dairyBreeding.eventDate));
    }),

  createBreeding: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number(),
        eventDate: z.string(),
        method: z.string().optional(),
        sireInfo: z.string().optional(),
        pregnancyStatus: z.enum(["pending", "confirmed", "failed"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, eventDate: new Date(input.eventDate) };
      const [result] = await db.insert(dairyBreeding).values(data);
      return { id: (result as any).insertId };
    }),

  // ── Calving ───────────────────────────────────────────────────────────────────
  listCalving: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db
        .select()
        .from(dairyCalving)
        .where(eq(dairyCalving.farmId, input.farmId))
        .orderBy(desc(dairyCalving.createdAt));
    }),

  createCalving: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number(),
        expectedDate: z.string().optional(),
        actualDate: z.string().optional(),
        calfCount: z.number().min(1).default(1),
        complications: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input };
      if (data.expectedDate) data.expectedDate = new Date(data.expectedDate);
      if (data.actualDate) data.actualDate = new Date(data.actualDate);
      const [result] = await db.insert(dairyCalving).values(data);
      return { id: (result as any).insertId };
    }),
});
