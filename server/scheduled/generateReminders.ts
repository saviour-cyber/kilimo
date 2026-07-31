import { and, eq, lt, gte, lte } from "drizzle-orm";
import { getDb } from "../db";
import { tasks, notifications, cropPlantings, healthLogs, inventoryItems } from "../../drizzle/schema";
import { Request, Response } from "express";
import { sdk } from "../_core/sdk";

/**
 * Scheduled heartbeat handler for generating reminders.
 * Runs daily to create notifications for:
 * - Tasks due in the next 24 hours
 * - Overdue tasks
 * - Upcoming harvests
 * - Low-stock inventory items
 * - Upcoming vaccinations
 */
export async function generateRemindersHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "database unavailable" });
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let remindersCreated = 0;

    // ── 1. Tasks due in next 24 hours ────────────────────────────────────────────
    const dueTasks = await db
      .select()
      .from(tasks)
      .where(and(gte(tasks.dueDate, now), lte(tasks.dueDate, tomorrow), eq(tasks.status, "pending")));

    for (const task of dueTasks) {
      if (!task.dueDate) continue;

      const existingNotif = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.farmId, task.farmId),
            eq(notifications.category, "task"),
            eq(notifications.relatedEntityId, task.id)
          )
        )
        .limit(1);

      if (!existingNotif.length) {
        await db.insert(notifications).values({
          farmId: task.farmId,
          userId: task.assignedToUserId || task.createdByUserId || 0,
          title: `Task due: ${task.title}`,
          message: `Your task "${task.title}" is due ${task.dueDate.toLocaleDateString()}`,
          type: "alert",
          category: "task",
          relatedEntityType: "task",
          relatedEntityId: task.id,
          isRead: false,
        });
        remindersCreated++;
      }
    }

    // ── 2. Overdue tasks ────────────────────────────────────────────────────────
    const overdueTasks = await db
      .select()
      .from(tasks)
      .where(and(lt(tasks.dueDate, now), eq(tasks.status, "pending")));

    for (const task of overdueTasks) {
      if (!task.dueDate) continue;

      const existingNotif = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.farmId, task.farmId),
            eq(notifications.category, "task"),
            eq(notifications.relatedEntityId, task.id)
          )
        )
        .limit(1);

      if (!existingNotif.length) {
        await db.insert(notifications).values({
          farmId: task.farmId,
          userId: task.assignedToUserId || task.createdByUserId || 0,
          title: `Overdue: ${task.title}`,
          message: `Your task "${task.title}" is overdue since ${task.dueDate.toLocaleDateString()}`,
          type: "warning",
          category: "task",
          relatedEntityType: "task",
          relatedEntityId: task.id,
          isRead: false,
        });
        remindersCreated++;
      }
    }

    // ── 3. Upcoming harvests (plantings in harvest_ready stage) ─────────────────
    const readyForHarvest = await db
      .select()
      .from(cropPlantings)
      .where(and(eq(cropPlantings.growthStage, "harvest_ready"), eq(cropPlantings.status, "active")));

    for (const planting of readyForHarvest) {
      const existingNotif = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.farmId, planting.farmId),
            eq(notifications.category, "crop"),
            eq(notifications.relatedEntityId, planting.id)
          )
        )
        .limit(1);

      if (!existingNotif.length) {
        await db.insert(notifications).values({
          farmId: planting.farmId,
          userId: planting.createdByUserId || 0,
          title: `Ready to harvest: ${planting.cropName}`,
          message: `Your ${planting.cropName} crop is ready for harvest`,
          type: "success",
          category: "crop",
          relatedEntityType: "planting",
          relatedEntityId: planting.id,
          isRead: false,
        });
        remindersCreated++;
      }
    }

    // ── 4. Low-stock inventory items ────────────────────────────────────────────
    const lowStockItems = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.isArchived, false));

    for (const item of lowStockItems) {
      const current = parseFloat(String(item.currentStock)) || 0;
      const minimum = parseFloat(String(item.minimumStock)) || 0;

      if (current <= minimum && minimum > 0) {
        const existingNotif = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.farmId, item.farmId),
              eq(notifications.category, "inventory"),
              eq(notifications.relatedEntityId, item.id)
            )
          )
          .limit(1);

        if (!existingNotif.length) {
          await db.insert(notifications).values({
            farmId: item.farmId,
            userId: 0, // System notification
            title: `Low stock: ${item.name}`,
            message: `${item.name} is running low (${current} ${item.unit} remaining)`,
            type: "warning",
            category: "inventory",
            relatedEntityType: "inventoryItem",
            relatedEntityId: item.id,
            isRead: false,
          });
          remindersCreated++;
        }
      }
    }

    // ── 5. Upcoming vaccinations (health logs due in next 7 days) ────────────────
    const upcomingVaccinations = await db
      .select()
      .from(healthLogs)
      .where(
        and(
          gte(healthLogs.nextDueDate, now),
          lte(healthLogs.nextDueDate, nextWeek),
          eq(healthLogs.logType, "vaccination")
        )
      );

    for (const vac of upcomingVaccinations) {
      if (!vac.nextDueDate) continue;

      const existingNotif = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.farmId, vac.farmId),
            eq(notifications.category, "livestock"),
            eq(notifications.relatedEntityId, vac.id)
          )
        )
        .limit(1);

      if (!existingNotif.length) {
        await db.insert(notifications).values({
          farmId: vac.farmId,
          userId: vac.recordedByUserId || 0,
          title: `Vaccination due: ${vac.title}`,
          message: `Vaccination scheduled for ${vac.nextDueDate.toLocaleDateString()}`,
          type: "alert",
          category: "livestock",
          relatedEntityType: "healthLog",
          relatedEntityId: vac.id,
          isRead: false,
        });
        remindersCreated++;
      }
    }

    res.json({
      ok: true,
      remindersCreated,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error("[generateReminders] Error:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
      stack: error.stack,
      context: { url: req.url, taskUid: (req as any).user?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
