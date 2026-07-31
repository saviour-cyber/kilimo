import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { createHeartbeatJob, updateHeartbeatJob, deleteHeartbeatJob, listHeartbeatJobs } from "../_core/heartbeat";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "../db";
import { and, eq } from "drizzle-orm";
import { farms } from "../../drizzle/schema";

/**
 * Reminders router for managing automated reminder generation via Heartbeat.
 * Allows farm owners/managers to schedule daily reminder generation.
 */
export const remindersRouter = router({
  // ── Create Daily Reminder Job ──────────────────────────────────────────────────
  createDailyReminderJob: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      time: z.string().default("09:00"), // HH:MM format, UTC
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify user is farm owner
      const farm = (
        await db
          .select()
          .from(farms)
          .where(eq(farms.id, input.farmId))
          .limit(1)
      )[0];

      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Farm not found" });
      if (farm.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only farm owner can create reminder jobs" });
      }

      // Parse time and create cron expression
      const [hours, minutes] = input.time.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid time format (use HH:MM)" });
      }

      const cronExpression = `0 ${minutes} ${hours} * * *`; // Daily at specified time

      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (!sessionToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Session token not found" });
      }

      try {
        const job = await createHeartbeatJob(
          {
            name: `farm-${input.farmId}-daily-reminders`,
            cron: cronExpression,
            path: "/api/scheduled/generateReminders",
            description: `Daily reminder generation for farm ${farm.name}`,
          },
          sessionToken
        );

        return {
          taskUid: job.taskUid,
          nextExecutionAt: job.nextExecutionAt,
          message: `Reminder job created. Next execution: ${job.nextExecutionAt}`,
        };
      } catch (error: any) {
        console.error("[createDailyReminderJob] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to create reminder job",
        });
      }
    }),

  // ── List Reminder Jobs ─────────────────────────────────────────────────────────
  listReminderJobs: protectedProcedure.query(async ({ ctx }) => {
    const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    if (!sessionToken) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Session token not found" });
    }

    try {
      const result = await listHeartbeatJobs(sessionToken);
      // Filter to only reminder jobs
      const reminderJobs = result.jobs.filter((j) => j.name.includes("daily-reminders"));
      return reminderJobs;
    } catch (error: any) {
      console.error("[listReminderJobs] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to list reminder jobs",
      });
    }
  }),

  // ── Update Reminder Job ────────────────────────────────────────────────────────
  updateReminderJob: protectedProcedure
    .input(z.object({
      taskUid: z.string(),
      enable: z.boolean().optional(),
      cron: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (!sessionToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Session token not found" });
      }

      try {
        const result = await updateHeartbeatJob(
          input.taskUid,
          {
            enable: input.enable,
            cron: input.cron,
          },
          sessionToken
        );

        return {
          taskUid: input.taskUid,
          nextExecutionAt: result.nextExecutionAt,
          message: "Reminder job updated",
        };
      } catch (error: any) {
        console.error("[updateReminderJob] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to update reminder job",
        });
      }
    }),

  // ── Delete Reminder Job ────────────────────────────────────────────────────────
  deleteReminderJob: protectedProcedure
    .input(z.object({ taskUid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (!sessionToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Session token not found" });
      }

      try {
        await deleteHeartbeatJob(input.taskUid, sessionToken);
        return { success: true, message: "Reminder job deleted" };
      } catch (error: any) {
        console.error("[deleteReminderJob] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to delete reminder job",
        });
      }
    }),
});
