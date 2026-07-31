import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { notifications } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember } from "./farms";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ farmId: z.number(), unreadOnly: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(notifications.farmId, input.farmId), eq(notifications.userId, ctx.user.id)];
      if (input.unreadOnly) conditions.push(eq(notifications.isRead, false));
      return db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt)).limit(50);
    }),

  unreadCount: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const unread = await db.select().from(notifications).where(
        and(eq(notifications.farmId, input.farmId), eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false))
      );
      return { count: unread.length };
    }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      await db.update(notifications).set({ isRead: true }).where(
        and(eq(notifications.id, input.notificationId), eq(notifications.userId, ctx.user.id))
      );
      return { success: true };
    }),

  markAllRead: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      await db.update(notifications).set({ isRead: true }).where(
        and(eq(notifications.farmId, input.farmId), eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false))
      );
      return { success: true };
    }),

  create: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      userId: z.number(),
      title: z.string(),
      message: z.string().optional(),
      type: z.enum(["info", "warning", "alert", "success"]).optional(),
      category: z.enum(["task", "crop", "livestock", "inventory", "finance", "system"]).optional(),
      relatedEntityType: z.string().optional(),
      relatedEntityId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const [result] = await db.insert(notifications).values(input as any);
      return { notificationId: (result as any).insertId };
    }),
});
