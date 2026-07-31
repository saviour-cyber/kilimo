/**
 * Device Registry
 *
 * Manages registration, lookup, and lifecycle of IoT Devices and Sensors.
 * Enforces strict farm-level isolation so cross-farm data leakage is impossible.
 * All TRPC routes and the SimulatedProvider go through this registry —
 * never directly to the DB tables.
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "../../db";
import {
  iotDevices, iotSensors, InsertIotDevice, InsertIotSensor, IotDevice, IotSensor,
} from "../../../drizzle/schema";

// ─── Sensor Metadata Catalogue ─────────────────────────────────────────────────
// Drives automatic sensor creation when a new simulated device is registered.

export const SENSOR_CATALOGUE = {
  weather_station: [
    { sensorType: "air_temperature",  category: "environmental", unit: "°C",   label: "Air Temperature",  alertMin: 5,  alertMax: 45 },
    { sensorType: "humidity",         category: "environmental", unit: "%",    label: "Humidity",         alertMin: 20, alertMax: 95 },
    { sensorType: "rainfall",         category: "environmental", unit: "mm",   label: "Rainfall" },
    { sensorType: "wind_speed",       category: "environmental", unit: "km/h", label: "Wind Speed",       alertMax: 80 },
    { sensorType: "solar_radiation",  category: "environmental", unit: "W/m²", label: "Solar Radiation" },
  ],
  soil_probe: [
    { sensorType: "soil_moisture",    category: "soil", unit: "%",    label: "Soil Moisture",    alertMin: 20, alertMax: 90 },
    { sensorType: "soil_temperature", category: "soil", unit: "°C",   label: "Soil Temperature", alertMin: 5,  alertMax: 40 },
    { sensorType: "soil_ph",          category: "soil", unit: "pH",   label: "Soil pH",          alertMin: 4,  alertMax: 8.5 },
    { sensorType: "soil_ec",          category: "soil", unit: "mS/cm",label: "Electrical Conductivity", alertMax: 4 },
  ],
  water_sensor: [
    { sensorType: "tank_level",         category: "water", unit: "%",  label: "Tank Level",   alertMin: 10, alertMax: 100 },
    { sensorType: "water_flow",         category: "water", unit: "L/h",label: "Water Flow" },
    { sensorType: "irrigation_pressure",category: "water", unit: "bar",label: "Irrigation Pressure", alertMin: 0.5, alertMax: 5 },
  ],
  livestock_collar: [
    { sensorType: "livestock_temperature", category: "livestock", unit: "°C",   label: "Body Temperature", alertMin: 37, alertMax: 40.5 },
    { sensorType: "activity",              category: "livestock", unit: "steps",label: "Activity Level" },
    { sensorType: "gps_location",          category: "livestock", unit: "coords",label: "GPS Location" },
  ],
  equipment_sensor: [
    { sensorType: "fuel_level",      category: "equipment", unit: "%",  label: "Fuel Level",      alertMin: 10 },
    { sensorType: "battery_voltage", category: "equipment", unit: "V",  label: "Battery Voltage", alertMin: 11.5 },
    { sensorType: "engine_hours",    category: "equipment", unit: "hrs",label: "Engine Hours" },
  ],
  gateway: [],
  other:   [],
} as const;

// ─── Registry Class ────────────────────────────────────────────────────────────

export class DeviceRegistry {

  /** Register a new device and auto-create all its sensors from the catalogue. */
  async registerDevice(input: InsertIotDevice): Promise<{ device: IotDevice; sensors: IotSensor[] }> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.insert(iotDevices).values(input);

    // Fetch the newly inserted device
    const devices = await db.select().from(iotDevices)
      .where(and(eq(iotDevices.farmId, input.farmId), eq(iotDevices.name, input.name)))
      .limit(1);
    const device = devices[0];

    // Auto-create sensors from catalogue
    const sensorDefs = SENSOR_CATALOGUE[input.deviceType as keyof typeof SENSOR_CATALOGUE] ?? [];
    const createdSensors: IotSensor[] = [];

    for (const def of sensorDefs) {
      await db.insert(iotSensors).values({
        deviceId:   device.id,
        farmId:     device.farmId,
        sensorType: def.sensorType as any,
        category:   def.category as any,
        label:      def.label,
        unit:       def.unit,
        alertMin:   (def as any).alertMin ?? null,
        alertMax:   (def as any).alertMax ?? null,
        isActive:   true,
      });
    }

    const sensors = await db.select().from(iotSensors)
      .where(eq(iotSensors.deviceId, device.id));

    return { device, sensors };
  }

  /** Get all devices for a farm (farm-isolated). */
  async getDevices(farmId: number): Promise<IotDevice[]> {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(iotDevices).where(eq(iotDevices.farmId, farmId));
  }

  /** Get all sensors for a device. */
  async getSensors(deviceId: number): Promise<IotSensor[]> {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(iotSensors).where(eq(iotSensors.deviceId, deviceId));
  }

  /** Get all sensors for a farm, optionally filtered by category. */
  async getFarmSensors(farmId: number, category?: string): Promise<IotSensor[]> {
    const db = await getDb();
    if (!db) return [];
    const query = db.select().from(iotSensors).where(
      category
        ? and(eq(iotSensors.farmId, farmId), eq(iotSensors.category, category as any))
        : eq(iotSensors.farmId, farmId)
    );
    return query;
  }

  /** Mark a device as online/offline. */
  async updateDeviceStatus(deviceId: number, status: "online" | "offline" | "error", batteryLevel?: number) {
    const db = await getDb();
    if (!db) return;
    await db.update(iotDevices)
      .set({
        status,
        lastCommunicationAt: new Date(),
        ...(batteryLevel !== undefined ? { batteryLevel } : {}),
      })
      .where(eq(iotDevices.id, deviceId));
  }
}

export const deviceRegistry = new DeviceRegistry();
