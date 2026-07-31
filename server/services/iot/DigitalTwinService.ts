/**
 * Digital Twin Service — Phase 5
 *
 * Links physical farm entities (fields, paddocks, greenhouses, sheds, tanks, zones)
 * to their IoT devices. Business Modules retrieve telemetry through these
 * physical entities rather than individual devices.
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "../../db";
import {
  iotDigitalTwins, iotDevices, iotSensors, iotSensorState,
  InsertIotDigitalTwin, IotDigitalTwin,
} from "../../../drizzle/schema";

export type TwinEntityType =
  | "field" | "paddock" | "greenhouse" | "livestock_shed"
  | "water_tank" | "irrigation_zone" | "equipment_yard" | "other";

class DigitalTwinService {

  /** Register a new digital twin for a farm entity */
  async registerTwin(input: {
    farmId:     number;
    label:      string;
    entityType: TwinEntityType;
    entityId?:  number;
    description?: string;
    location?:  Record<string, unknown>;
  }): Promise<IotDigitalTwin> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.insert(iotDigitalTwins).values({
      farmId:     input.farmId,
      label:      input.label,
      entityType: input.entityType,
      entityId:   input.entityId ?? null,
      description: input.description ?? null,
      location:   input.location ?? null,
    });

    const [twin] = await db.select().from(iotDigitalTwins)
      .where(and(eq(iotDigitalTwins.farmId, input.farmId), eq(iotDigitalTwins.label, input.label)))
      .limit(1);
    return twin;
  }

  /** Get all twins for a farm */
  async getTwinsForFarm(farmId: number): Promise<IotDigitalTwin[]> {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(iotDigitalTwins).where(eq(iotDigitalTwins.farmId, farmId));
  }

  /** Get all devices linked to a twin */
  async getDevicesForTwin(twinId: number) {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(iotDevices).where(eq(iotDevices.twinId, twinId));
  }

  /** Get aggregated latest sensor state for all devices under a twin */
  async getTwinSensorState(twinId: number) {
    const db = await getDb();
    if (!db) return [];

    const devices = await db.select({ id: iotDevices.id })
      .from(iotDevices)
      .where(eq(iotDevices.twinId, twinId));

    if (devices.length === 0) return [];

    const deviceIds = devices.map(d => d.id);

    // Fetch first device to get farmId
    const firstDevice = await db.select({ farmId: iotDevices.farmId })
      .from(iotDevices)
      .where(eq(iotDevices.id, deviceIds[0]))
      .limit(1);
    const farmId = firstDevice[0]?.farmId ?? 0;

    // Fetch sensors for those devices
    const sensors = await db.select().from(iotSensors)
      .where(eq(iotSensors.farmId, farmId));

    const twinSensors = sensors.filter(s => deviceIds.includes(s.deviceId));
    const sensorIds   = twinSensors.map(s => s.id);

    if (sensorIds.length === 0) return [];

    // Get latest state for those sensors
    const states = await db.select().from(iotSensorState)
      .where(eq(iotSensorState.farmId, twinSensors[0]?.farmId ?? 0));

    return states
      .filter(st => sensorIds.includes(st.sensorId))
      .map(st => {
        const sensor = twinSensors.find(s => s.id === st.sensorId);
        return {
          ...st,
          sensorType: sensor?.sensorType,
          label:      sensor?.label,
          unit:       sensor?.unit,
        };
      });
  }

  /** Assign a device to a digital twin */
  async assignDevice(deviceId: number, twinId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.update(iotDevices).set({ twinId }).where(eq(iotDevices.id, deviceId));
  }

  /** Remove a device from its twin */
  async unassignDevice(deviceId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.update(iotDevices).set({ twinId: null }).where(eq(iotDevices.id, deviceId));
  }
}

export const digitalTwinService = new DigitalTwinService();
