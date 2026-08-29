import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  workers,
  workerTeams,
  workerAttendance,
  workerPayroll,
  workerDocuments,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const workersRouter = router({
  // ────────────────────────────────────────────────────── Teams ──
  listTeams: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db
        .select()
        .from(workerTeams)
        .where(eq(workerTeams.farmId, input.farmId))
        .orderBy(desc(workerTeams.createdAt));
    }),

  createTeam: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      const [result] = await db.insert(workerTeams).values({
        farmId: input.farmId,
        name: input.name,
        description: input.description,
      });
      return { success: true, teamId: result.insertId };
    }),

  // ────────────────────────────────────────────────────── Workers ──
  listWorkers: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        status: z.string().optional(),
        teamId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const conditions: any[] = [eq(workers.farmId, input.farmId)];
      if (input.status) conditions.push(eq(workers.status, input.status as any));
      if (input.teamId) conditions.push(eq(workers.teamId, input.teamId));

      return db
        .select()
        .from(workers)
        .where(and(...conditions))
        .orderBy(desc(workers.createdAt));
    }),

  getWorker: protectedProcedure
    .input(z.object({ farmId: z.number(), workerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const [worker] = await db
        .select()
        .from(workers)
        .where(and(eq(workers.id, input.workerId), eq(workers.farmId, input.farmId)))
        .limit(1);
      if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "Worker not found" });
      return worker;
    }),

  createWorker: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        position: z.string().optional(),
        employmentType: z
          .enum(["full_time", "part_time", "seasonal", "contractor", "temporary"])
          .default("full_time"),
        teamId: z.number().optional(),
        startDate: z.string().optional(),
        skills: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      const [result] = await db.insert(workers).values({
        farmId: input.farmId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        email: input.email || null,
        position: input.position || null,
        employmentType: input.employmentType,
        teamId: input.teamId || null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        skills: input.skills || null,
        notes: input.notes || null,
      });
      return { success: true, workerId: result.insertId };
    }),

  updateWorker: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        workerId: z.number(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        position: z.string().optional(),
        employmentType: z
          .enum(["full_time", "part_time", "seasonal", "contractor", "temporary"])
          .optional(),
        status: z.enum(["active", "inactive", "on_leave", "terminated"]).optional(),
        teamId: z.number().optional(),
        startDate: z.string().optional(),
        skills: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      const [existing] = await db
        .select({ id: workers.id })
        .from(workers)
        .where(and(eq(workers.id, input.workerId), eq(workers.farmId, input.farmId)))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Worker not found" });

      await db
        .update(workers)
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone || null,
          email: input.email || null,
          position: input.position || null,
          employmentType: input.employmentType,
          status: input.status,
          teamId: input.teamId || null,
          startDate: input.startDate ? new Date(input.startDate) : null,
          skills: input.skills || null,
          notes: input.notes || null,
        })
        .where(eq(workers.id, input.workerId));

      return { success: true };
    }),

  deleteWorker: protectedProcedure
    .input(z.object({ farmId: z.number(), workerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      const [existing] = await db
        .select({ id: workers.id })
        .from(workers)
        .where(and(eq(workers.id, input.workerId), eq(workers.farmId, input.farmId)))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Worker not found" });

      await db.delete(workers).where(eq(workers.id, input.workerId));
      return { success: true };
    }),

  // ────────────────────────────────────────────────────── Attendance ──
  recordAttendance: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        workerId: z.number(),
        date: z.string(),
        status: z.enum(["present", "absent", "half_day", "on_leave"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      // Verify worker belongs to farm
      const [worker] = await db
        .select({ id: workers.id })
        .from(workers)
        .where(and(eq(workers.id, input.workerId), eq(workers.farmId, input.farmId)))
        .limit(1);
      if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "Worker not found" });

      const dateObj = new Date(input.date);

      // Upsert: update if record for that day already exists
      const [existing] = await db
        .select()
        .from(workerAttendance)
        .where(
          and(
            eq(workerAttendance.workerId, input.workerId),
            eq(workerAttendance.date, dateObj)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(workerAttendance)
          .set({ status: input.status, notes: input.notes || null })
          .where(eq(workerAttendance.id, existing.id));
      } else {
        await db.insert(workerAttendance).values({
          farmId: input.farmId,
          workerId: input.workerId,
          date: dateObj,
          status: input.status,
          notes: input.notes || null,
        });
      }
      return { success: true };
    }),

  // Bulk attendance: log an entire list of workers at once
  recordBulkAttendance: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        date: z.string(),
        records: z.array(
          z.object({
            workerId: z.number(),
            status: z.enum(["present", "absent", "half_day", "on_leave"]),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      const dateObj = new Date(input.date);
      for (const rec of input.records) {
        const [existing] = await db
          .select({ id: workerAttendance.id })
          .from(workerAttendance)
          .where(
            and(
              eq(workerAttendance.workerId, rec.workerId),
              eq(workerAttendance.date, dateObj)
            )
          )
          .limit(1);

        if (existing) {
          await db
            .update(workerAttendance)
            .set({ status: rec.status, notes: rec.notes || null })
            .where(eq(workerAttendance.id, existing.id));
        } else {
          await db.insert(workerAttendance).values({
            farmId: input.farmId,
            workerId: rec.workerId,
            date: dateObj,
            status: rec.status,
            notes: rec.notes || null,
          });
        }
      }
      return { success: true };
    }),

  listAttendance: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        workerId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const conditions: any[] = [eq(workerAttendance.farmId, input.farmId)];
      if (input.workerId) conditions.push(eq(workerAttendance.workerId, input.workerId));

      return db
        .select()
        .from(workerAttendance)
        .where(and(...conditions))
        .orderBy(desc(workerAttendance.date))
        .limit(200);
    }),

  // ────────────────────────────────────────────────────── Payroll ──
  listPayroll: protectedProcedure
    .input(z.object({ farmId: z.number(), workerId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const conditions: any[] = [eq(workerPayroll.farmId, input.farmId)];
      if (input.workerId) conditions.push(eq(workerPayroll.workerId, input.workerId));

      return db
        .select()
        .from(workerPayroll)
        .where(and(...conditions))
        .orderBy(desc(workerPayroll.createdAt));
    }),

  createPayroll: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        workerId: z.number(),
        amount: z.number(),
        periodStart: z.string(),
        periodEnd: z.string(),
        status: z.enum(["pending", "paid", "cancelled"]).default("pending"),
        paymentDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      await db.insert(workerPayroll).values({
        farmId: input.farmId,
        workerId: input.workerId,
        amount: input.amount.toString(),
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        status: input.status,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
        notes: input.notes || null,
      });
      return { success: true };
    }),

  updatePayroll: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        payrollId: z.number(),
        status: z.enum(["pending", "paid", "cancelled"]),
        paymentDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      await db
        .update(workerPayroll)
        .set({
          status: input.status,
          paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
        })
        .where(
          and(
            eq(workerPayroll.id, input.payrollId),
            eq(workerPayroll.farmId, input.farmId)
          )
        );
      return { success: true };
    }),

  // ────────────────────────────────────────────────────── Documents ──
  listDocuments: protectedProcedure
    .input(z.object({ farmId: z.number(), workerId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const conditions: any[] = [eq(workerDocuments.farmId, input.farmId)];
      if (input.workerId) conditions.push(eq(workerDocuments.workerId, input.workerId));

      return db
        .select()
        .from(workerDocuments)
        .where(and(...conditions))
        .orderBy(desc(workerDocuments.uploadedAt));
    }),

  createDocument: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        workerId: z.number(),
        title: z.string().min(1),
        documentType: z
          .enum(["contract", "id", "certificate", "other"])
          .default("other"),
        base64: z.string(),
        contentType: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      const safeName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `workers/documents/${input.workerId}/${Date.now()}-${safeName}`;
      const buffer = Buffer.from(input.base64, "base64");
      const { url } = await storagePut(key, buffer, input.contentType);

      await db.insert(workerDocuments).values({
        farmId: input.farmId,
        workerId: input.workerId,
        title: input.title,
        documentType: input.documentType,
        fileUrl: url,
      });
      return { success: true };
    }),

  deleteDocument: protectedProcedure
    .input(z.object({ farmId: z.number(), documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      await db
        .delete(workerDocuments)
        .where(
          and(
            eq(workerDocuments.id, input.documentId),
            eq(workerDocuments.farmId, input.farmId)
          )
        );
      return { success: true };
    }),
});