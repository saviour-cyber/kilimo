/**
 * IoT Event Service — Phase 5
 *
 * Persists all operational IoT events to the iotEvents table.
 * This is separate from iotTelemetry (sensor readings) — this table
 * records system-level events: device online/offline, commands, calibrations,
 * alerts, registration, firmware updates, provider failures, etc.
 *
 * Provides complete operational auditing, troubleshooting, and analytics
 * without mixing system events with telemetry data.
 */

import { eq, desc, and } from "drizzle-orm";
import { getDb } from "../../db";
import { iotEvents } from "../../../drizzle/schema";
import { iotEventBus, IOT_EVENTS } from "./EventBus";

class IotEventService {
  constructor() {
    this.subscribeToAllEvents();
  }

  private subscribeToAllEvents(): void {
    // Subscribe to every known IoT event and persist it
    const allEvents = Object.values(IOT_EVENTS);

    for (const eventType of allEvents) {
      iotEventBus.subscribe(eventType, async (event) => {
        await this.record({
          farmId:    event.farmId,
          eventType: event.type,
          source:    event.source,
          payload:   (event.payload as Record<string, unknown>) ?? null,
          deviceId:  (event.payload as any)?.deviceId  ?? null,
          sensorId:  (event.payload as any)?.sensorId  ?? null,
          gatewayId: (event.payload as any)?.gatewayId ?? null,
        });
      });
    }

    console.log(`[IotEventService] Subscribed to ${allEvents.length} event types for audit logging`);
  }

  /** Persist a single event to iotEvents */
  async record(input: {
    farmId:    number;
    eventType: string;
    source:    string;
    payload?:  Record<string, unknown>;
    deviceId?:  number | null;
    sensorId?:  number | null;
    gatewayId?: number | null;
  }): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      await db.insert(iotEvents).values({
        farmId:    input.farmId,
        eventType: input.eventType,
        source:    input.source,
        payload:   input.payload ?? null,
        deviceId:  input.deviceId  ?? null,
        sensorId:  input.sensorId  ?? null,
        gatewayId: input.gatewayId ?? null,
      });
    } catch (err) {
      // Event logging must never crash the main pipeline
      console.error("[IotEventService] Failed to record event:", err);
    }
  }

  /** Retrieve event history for a farm (for admin/audit views) */
  async getEventHistory(farmId: number, limit = 100) {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(iotEvents)
      .where(eq(iotEvents.farmId, farmId))
      .orderBy(desc(iotEvents.createdAt))
      .limit(limit);
  }

  /** Retrieve events for a specific device */
  async getDeviceHistory(deviceId: number, limit = 50) {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(iotEvents)
      .where(eq(iotEvents.deviceId, deviceId))
      .orderBy(desc(iotEvents.createdAt))
      .limit(limit);
  }
}

export const iotEventService = new IotEventService();
