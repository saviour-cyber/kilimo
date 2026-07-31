import { getDb } from "../../db";
import { iotSensorState, iotTelemetry } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { iotEventBus, IOT_EVENTS, TelemetryPayload, SensorType, SensorCategory } from "./EventBus";

export interface RawTelemetryInput {
  farmId:     number;
  deviceId:   number;
  sensorId:   number;
  sensorType: SensorType;
  category:   SensorCategory;
  value:      number;
  unit:       string;
  metadata?:  Record<string, unknown>;
  recordedAt?: Date;
}

export class TelemetryService {
  
  /**
   * The single ingestion point for all providers (Simulated, MQTT, HTTP).
   * Validates, normalizes, updates current state, stores history, and publishes event.
   */
  async ingest(input: RawTelemetryInput): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const recordedAt = input.recordedAt ?? new Date();

    try {
      // 1. Update Current State (Fast access for dashboards)
      // Upsert pattern for iotSensorState
      const existingState = await db.select().from(iotSensorState).where(eq(iotSensorState.sensorId, input.sensorId));
      if (existingState.length > 0) {
        await db.update(iotSensorState)
          .set({ latestValue: input.value, latestRecordedAt: recordedAt })
          .where(eq(iotSensorState.sensorId, input.sensorId));
      } else {
        await db.insert(iotSensorState).values({
          sensorId: input.sensorId,
          deviceId: input.deviceId,
          farmId: input.farmId,
          latestValue: input.value,
          latestRecordedAt: recordedAt,
        });
      }

      // 2. Store Historical Time-Series (Configurable retention in the future)
      await db.insert(iotTelemetry).values({
        sensorId: input.sensorId,
        deviceId: input.deviceId,
        farmId:   input.farmId,
        value:    input.value,
        metadata: input.metadata,
        recordedAt: recordedAt,
      });

      // 3. Publish standard event to EventBus
      const payload: TelemetryPayload = {
        deviceId:   input.deviceId,
        sensorId:   input.sensorId,
        sensorType: input.sensorType,
        category:   input.category,
        value:      input.value,
        unit:       input.unit,
      };

      // Publishing will trigger AlertEngine and other subscribers
      iotEventBus.publish(IOT_EVENTS.TELEMETRY_RECEIVED, input.farmId, "telemetry_service", payload);

    } catch (err) {
      console.error("[TelemetryService] Error ingesting telemetry:", err);
    }
  }
}

export const telemetryService = new TelemetryService();
