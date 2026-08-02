import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { tasks } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const tasksRouter = router({
  list: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      status: z.string().optional(),
      category: z.string().optional(),
      assignedToMe: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(tasks.farmId, input.farmId)];
      if (input.status) conditions.push(eq(tasks.status, input.status as any));
      if (input.category) conditions.push(eq(tasks.category, input.category as any));
      if (input.assignedToMe) conditions.push(eq(tasks.assignedToUserId, ctx.user.id));
      return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      title: z.string().min(1).max(256),
      description: z.string().optional(),
      category: z.enum(["crop", "livestock", "inventory", "finance", "maintenance", "general"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      dueDate: z.string().optional(),
      assignedToUserId: z.number().optional(),
      relatedEntityType: z.string().optional(),
      relatedEntityId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, createdByUserId: ctx.user.id };
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      const [result] = await db.insert(tasks).values(data);
      return { taskId: (result as any).insertId };
    }),

  update: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      farmId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      dueDate: z.string().optional(),
      assignedToUserId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { taskId, farmId, ...rawData } = input;
      const data: any = { ...rawData };
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      if (data.status === "completed") data.completedAt = new Date();
      await db.update(tasks).set(data).where(and(eq(tasks.id, taskId), eq(tasks.farmId, farmId)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ taskId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");
      await db.delete(tasks).where(and(eq(tasks.id, input.taskId), eq(tasks.farmId, input.farmId)));
      return { success: true };
    }),

  // ── Dashboard Summary ─────────────────────────────────────────────────────────
  dashboardSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const allTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.farmId, input.farmId))
        .orderBy(desc(tasks.createdAt));

      const pending = allTasks.filter(t => t.status === "pending");
      const inProgress = allTasks.filter(t => t.status === "in_progress");
      const overdue = pending.filter(t => t.dueDate && new Date(String(t.dueDate)) < new Date());

      return {
        pendingCount: pending.length,
        inProgressCount: inProgress.length,
        overdueCount: overdue.length,
        upcomingTasks: pending.slice(0, 5).map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : null,
          category: t.category,
        })),
      };
    }),
});
