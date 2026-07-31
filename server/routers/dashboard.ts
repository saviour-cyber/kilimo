import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { activityLogs, animals, cropPlantings, financeTransactions, inventoryItems, tasks } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember } from "./farms";

export const dashboardRouter = router({
  recentActivity: protectedProcedure
    .input(z.object({ farmId: z.number(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(activityLogs)
        .where(eq(activityLogs.farmId, input.farmId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(input.limit);
    }),

  logActivity: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      action: z.string(),
      entityType: z.string().optional(),
      entityId: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      await db.insert(activityLogs).values({ ...input, userId: ctx.user.id });
      return { success: true };
    }),
});

