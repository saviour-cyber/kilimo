import { getDb } from "../../db";
import { notifications, iotAlertRules } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { iotEventBus, IOT_EVENTS, ThresholdExceededPayload } from "../iot/EventBus";
import { getAIProvider } from "./index";

export class AiEventHandler {
  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    // Listen for IoT Threshold breaches that request an AI recommendation
    iotEventBus.subscribe<ThresholdExceededPayload>(IOT_EVENTS.THRESHOLD_EXCEEDED, async (event) => {
      try {
        const db = await getDb();
        if (!db) return;

        // Fetch the rule to check if it's an AI recommendation rule
        const [rule] = await db.select().from(iotAlertRules).where(eq(iotAlertRules.id, event.payload.ruleId));

        if (rule && rule.actionType === "recommendation") {
          console.log(`[Kili AI] Triggered by IoT Rule: ${rule.name}`);
          
          // Generate automated AI recommendation based on the alert
          const ai = getAIProvider();
          
          const context = `
IoT Alert Triggered:
- Farm ID: ${event.farmId}
- Rule Name: ${rule.name}
- Sensor Type: ${rule.sensorType || 'Specific Sensor'}
- Condition: value ${event.payload.condition} ${event.payload.threshold}
- Current Value: ${event.payload.value}
- Description: ${rule.description || 'No description provided'}
          `;

          const response = await ai.getDashboardRecommendations(context);

          // Format a nice notification message
          const msg = `**AI Insight for ${rule.name}**\n\n${response.summary}\n\n**Recommendations:**\n${response.recommendations.map(r => `• ${r}`).join('\n')}`;

          // Insert into notifications as an AI alert
          await db.insert(notifications).values({
            farmId: event.farmId,
            userId: rule.createdBy, // notify the person who created the rule
            type: "alert",
            category: "system",
            title: `Kili AI: ${rule.name}`,
            message: msg,
            isRead: false,
          });
        }
      } catch (err) {
        console.error("[Kili AI] Error handling IoT event:", err);
      }
    });
  }
}

// Singleton initialization
export const aiEventHandler = new AiEventHandler();
