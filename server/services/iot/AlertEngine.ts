import { eq, and, sql, desc } from "drizzle-orm";
import { getDb } from "../../db";
import { iotAlertRules, iotAlerts, notifications, tasks } from "../../../drizzle/schema";
import { iotEventBus, IOT_EVENTS, TelemetryPayload, ThresholdExceededPayload } from "./EventBus";

export class AlertEngine {
  constructor() {
    this.subscribeToTelemetry();
  }

  /**
   * Evaluates incoming telemetry against configured rules.
   * Runs asynchronously in the background.
   */
  private subscribeToTelemetry() {
    iotEventBus.subscribe<TelemetryPayload>(IOT_EVENTS.TELEMETRY_RECEIVED, async (event) => {
      try {
        await this.evaluateRules(event.payload, event.farmId);
      } catch (err) {
        console.error("[AlertEngine] Error evaluating rules:", err);
      }
    });
  }

  private async evaluateRules(payload: TelemetryPayload, farmId: number) {
    const db = await getDb();
    if (!db) return;

    // Fetch active rules for this farm that match either the specific sensor or the sensor type
    const rules = await db.select().from(iotAlertRules).where(
      and(
        eq(iotAlertRules.farmId, farmId),
        eq(iotAlertRules.enabled, true),
        // Rule applies if sensorId matches OR if sensorId is null and sensorType matches
        sql`(${iotAlertRules.sensorId} = ${payload.sensorId} OR (${iotAlertRules.sensorId} IS NULL AND ${iotAlertRules.sensorType} = ${payload.sensorType}))`
      )
    );

    for (const rule of rules) {
      const isBreached = this.evaluateCondition(payload.value, rule.threshold, rule.condition);
      
      if (isBreached) {
        // Cooldown Check
        const recentAlerts = await db.select()
          .from(iotAlerts)
          .where(and(
            eq(iotAlerts.ruleId, rule.id),
            eq(iotAlerts.sensorId, payload.sensorId)
          ))
          .orderBy(desc(iotAlerts.createdAt))
          .limit(1);

        if (recentAlerts.length > 0) {
          const lastAlert = recentAlerts[0];
          const msSinceLast = Date.now() - lastAlert.createdAt.getTime();
          const cooldownMs = rule.cooldownPeriod * 60 * 1000;
          if (msSinceLast < cooldownMs) {
            console.log(`[AlertEngine] Cooldown active for rule ${rule.name}, sensor ${payload.sensorId}. Skipping.`);
            continue; // Skip triggering the alert and AI
          }
        }

        // Publish threshold exceeded event (triggers AI logic if configured)
        const exceededPayload: ThresholdExceededPayload = {
          ruleId: rule.id,
          sensorId: payload.sensorId,
          deviceId: payload.deviceId,
          value: payload.value,
          threshold: rule.threshold,
          condition: rule.condition,
        };

        iotEventBus.publish(IOT_EVENTS.THRESHOLD_EXCEEDED, farmId, "alert_engine", exceededPayload);

        // Execute actions (create notification, task, etc.)
        await this.executeAction(rule, payload, farmId);
      }
    }
  }

  private evaluateCondition(value: number, threshold: number, condition: string): boolean {
    switch (condition) {
      case ">": return value > threshold;
      case "<": return value < threshold;
      case ">=": return value >= threshold;
      case "<=": return value <= threshold;
      case "==": return value === threshold;
      case "!=": return value !== threshold;
      default: return false;
    }
  }

  private async executeAction(rule: typeof iotAlertRules.$inferSelect, payload: TelemetryPayload, farmId: number) {
    const db = await getDb();
    if (!db) return;
    
    // Replace template vars
    const msg = rule.messageTemplate
      .replace("{{sensor}}", payload.sensorType)
      .replace("{{value}}", payload.value.toString())
      .replace("{{unit}}", payload.unit);

    // Create IoT Alert Record
    await db.insert(iotAlerts).values({
      farmId,
      ruleId: rule.id,
      sensorId: payload.sensorId,
      deviceId: payload.deviceId,
      alertType: "threshold_high", 
      message: msg,
      value: payload.value,
    });

    iotEventBus.publish(IOT_EVENTS.ALERT_CREATED, farmId, "alert_engine", { ruleId: rule.id, message: msg });

    // Execute specific action type
    if (rule.actionType === "notify") {
      await db.insert(notifications).values({
        farmId,
        userId: rule.createdBy,
        type: rule.severity === "critical" ? "alert" : "warning",
        category: "system",
        title: rule.name,
        message: msg,
        isRead: false,
      });
    } else if (rule.actionType === "task") {
      await db.insert(tasks).values({
        farmId,
        title: `Action Required: ${rule.name}`,
        description: msg,
        category: "general",
        priority: rule.severity === "critical" ? "urgent" : rule.severity === "warning" ? "high" : "medium",
        status: "pending",
        createdByUserId: rule.createdBy,
        // we can assign it to the creator, or leave it unassigned
        assignedToUserId: rule.createdBy, 
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Due in 24 hours
      });
      console.log(`[AlertEngine] Created TASK for rule ${rule.name}`);
    } else if (rule.actionType === "webhook" && rule.webhookUrl) {
      try {
        await fetch(rule.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            farmId,
            ruleName: rule.name,
            sensorId: payload.sensorId,
            sensorType: payload.sensorType,
            value: payload.value,
            message: msg
          })
        });
        console.log(`[AlertEngine] Triggered WEBHOOK for rule ${rule.name}`);
      } catch (err) {
        console.error(`[AlertEngine] WEBHOOK Failed for rule ${rule.name}`, err);
      }
    } else if (rule.actionType === "recommendation") {
      console.log(`[AlertEngine] Triggering RECOMMENDATION for rule ${rule.name}`);
    }
  }
}

// Instantiate singleton
export const alertEngine = new AlertEngine();
