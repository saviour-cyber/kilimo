/**
 * IoT Core API — Phase 5
 *
 * THE SINGLE PUBLIC INTERFACE for the entire IoT Engine.
 *
 * All Business Modules, tRPC routes, Kili AI, Reports Hub, Dashboard widgets,
 * and Platform Services MUST interact with the IoT Engine exclusively through
 * this API. They must never import DeviceRegistry, TelemetryService, EventBus,
 * AlertEngine, providers, or any other internal service directly.
 *
 * This creates a stable contract between the IoT Engine and the rest of
 * KilimoHub, allowing the underlying implementation to evolve without
 * breaking any dependent modules.
 */

import { eq, and, desc, gte } from "drizzle-orm";
import { getDb } from "../../db";
import {
  iotDevices, iotSensors, iotSensorState, iotTelemetry,
  iotAlerts, iotAlertRules, iotSensorCalibrationLog,
  InsertIotDevice,
} from "../../../drizzle/schema";

// Internal services — only IotCoreApi imports these
import { deviceRegistry }    from "./DeviceRegistry";
import { telemetryService }  from "./TelemetryService";
import { commandService }    from "./CommandService";
import { digitalTwinService } from "./DigitalTwinService";
import { deviceGroupService } from "./DeviceGroupService";
import { gatewayService }    from "./GatewayService";
import { iotEventService }   from "./IotEventService";
import { providerRegistry }  from "./providers/ProviderRegistry";
import { calibrationLayer }  from "./CalibrationLayer";
import { iotEventBus, IOT_EVENTS } from "./EventBus";
import type { RawTelemetryInput } from "./TelemetryService";
import type { SendCommandInput }  from "./CommandService";
import type { TwinEntityType }    from "./DigitalTwinService";
import type { CommandType }       from "./providers/BaseProvider";

class IotCoreApi {

  // ── Boot / Shutdown ──────────────────────────────────────────────────────────

  /** Start all registered providers. Called once on server boot. */
  async bootProviders(): Promise<void> {
    await providerRegistry.connectAll();
  }

  /** Gracefully stop all providers. Called on server shutdown. */
  async shutdown(): Promise<void> {
    await providerRegistry.disconnectAll();
  }

  // ── Device Management ────────────────────────────────────────────────────────

  async registerDevice(input: InsertIotDevice) {
    const result = await deviceRegistry.registerDevice(input);
    iotEventBus.publish(IOT_EVENTS.DEVICE_REGISTERED, input.farmId, "iot_core_api", {
      deviceId: result.device.id,
    });
    return result;
  }

  async getDevices(farmId: number) {
    return deviceRegistry.getDevices(farmId);
  }

  async getDevice(deviceId: number) {
    const db = await getDb();
    if (!db) return null;
    const [device] = await db.select().from(iotDevices).where(eq(iotDevices.id, deviceId)).limit(1);
    return device ?? null;
  }

  // ── Sensor Management ────────────────────────────────────────────────────────

  async getFarmSensors(farmId: number, category?: string) {
    return deviceRegistry.getFarmSensors(farmId, category);
  }

  async getSensorCalibration(sensorId: number) {
    const db = await getDb();
    if (!db) return null;
    const [sensor] = await db.select({
      calibrationOffset:     iotSensors.calibrationOffset,
      calibrationMultiplier: iotSensors.calibrationMultiplier,
      calibrationMethod:     iotSensors.calibrationMethod,
      calibrationStatus:     iotSensors.calibrationStatus,
      lastCalibratedAt:      iotSensors.lastCalibratedAt,
      nextCalibrationAt:     iotSensors.nextCalibrationAt,
    }).from(iotSensors).where(eq(iotSensors.id, sensorId)).limit(1);
    return sensor ?? null;
  }

  async updateCalibration(input: {
    sensorId:   number;
    farmId:     number;
    calibratedBy: number;
    offset:     number;
    multiplier: number;
    method:     string;
    notes?:     string;
    nextCalibrationAt?: Date;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Read current values for the log
    const [current] = await db.select({
      offset:     iotSensors.calibrationOffset,
      multiplier: iotSensors.calibrationMultiplier,
    }).from(iotSensors).where(eq(iotSensors.id, input.sensorId)).limit(1);

    // Update sensor calibration fields
    await db.update(iotSensors).set({
      calibrationOffset:     input.offset,
      calibrationMultiplier: input.multiplier,
      calibrationMethod:     input.method,
      calibrationStatus:     "ok",
      lastCalibratedAt:      new Date(),
      nextCalibrationAt:     input.nextCalibrationAt ?? null,
    }).where(eq(iotSensors.id, input.sensorId));

    // Record in calibration log
    await db.insert(iotSensorCalibrationLog).values({
      sensorId:         input.sensorId,
      farmId:           input.farmId,
      calibratedBy:     input.calibratedBy,
      method:           input.method,
      offsetBefore:     current?.offset     ?? 0,
      multiplierBefore: current?.multiplier ?? 1,
      offsetAfter:      input.offset,
      multiplierAfter:  input.multiplier,
      notes:            input.notes ?? null,
    });

    iotEventBus.publish(IOT_EVENTS.CALIBRATION_UPDATED, input.farmId, "iot_core_api", {
      sensorId: input.sensorId,
      offset:   input.offset,
      multiplier: input.multiplier,
    });

    return { success: true };
  }

  // ── Telemetry ────────────────────────────────────────────────────────────────

  /** The only way business modules should publish raw telemetry (e.g. from custom integrations) */
  async publishTelemetry(input: RawTelemetryInput) {
    return telemetryService.ingest(input);
  }

  async getSensorState(farmId: number, sensorId?: number) {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select()
      .from(iotSensorState)
      .where(
        sensorId
          ? and(eq(iotSensorState.farmId, farmId), eq(iotSensorState.sensorId, sensorId))
          : eq(iotSensorState.farmId, farmId)
      )
      .orderBy(desc(iotSensorState.latestRecordedAt));
    return rows.map(r => ({ ...r, value: r.latestValue, recordedAt: r.latestRecordedAt }));
  }

  async getTelemetryHistory(farmId: number, sensorId: number, hours = 24) {
    const db = await getDb();
    if (!db) return [];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return db.select()
      .from(iotTelemetry)
      .where(and(
        eq(iotTelemetry.farmId, farmId),
        eq(iotTelemetry.sensorId, sensorId),
        gte(iotTelemetry.recordedAt, since),
      ))
      .orderBy(iotTelemetry.recordedAt)
      .limit(500);
  }

  // ── Commands ─────────────────────────────────────────────────────────────────

  async sendCommand(input: SendCommandInput) {
    return commandService.sendCommand(input);
  }

  async getCommandHistory(deviceId: number, limit = 50) {
    return commandService.getCommandHistory(deviceId, limit);
  }

  // ── Alerts ───────────────────────────────────────────────────────────────────

  async getAlerts(farmId: number, unreadOnly = true) {
    const db = await getDb();
    if (!db) return [];
    return db.select()
      .from(iotAlerts)
      .where(
        unreadOnly
          ? and(eq(iotAlerts.farmId, farmId), eq(iotAlerts.isRead, false))
          : eq(iotAlerts.farmId, farmId)
      )
      .orderBy(desc(iotAlerts.createdAt))
      .limit(50);
  }

  async markAlertRead(alertId: number) {
    const db = await getDb();
    if (!db) return;
    await db.update(iotAlerts).set({ isRead: true }).where(eq(iotAlerts.id, alertId));
  }

  async getAlertRules(farmId: number) {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(iotAlertRules)
      .where(eq(iotAlertRules.farmId, farmId))
      .orderBy(desc(iotAlertRules.createdAt));
  }

  // ── Device Groups ────────────────────────────────────────────────────────────

  async createGroup(input: { farmId: number; name: string; description?: string; color?: string; createdBy: number }) {
    return deviceGroupService.createGroup(input);
  }

  async getGroups(farmId: number) {
    return deviceGroupService.getGroupsForFarm(farmId);
  }

  async addDeviceToGroup(groupId: number, deviceId: number) {
    return deviceGroupService.addDevice(groupId, deviceId);
  }

  async removeDeviceFromGroup(groupId: number, deviceId: number) {
    return deviceGroupService.removeDevice(groupId, deviceId);
  }

  async getGroupSensorState(groupId: number) {
    return deviceGroupService.getGroupSensorState(groupId);
  }

  // ── Digital Twins ────────────────────────────────────────────────────────────

  async registerTwin(input: { farmId: number; label: string; entityType: TwinEntityType; entityId?: number; description?: string; location?: Record<string, unknown> }) {
    return digitalTwinService.registerTwin(input);
  }

  async getTwins(farmId: number) {
    return digitalTwinService.getTwinsForFarm(farmId);
  }

  async getTwinSensorState(twinId: number) {
    return digitalTwinService.getTwinSensorState(twinId);
  }

  async assignDeviceToTwin(deviceId: number, twinId: number) {
    return digitalTwinService.assignDevice(deviceId, twinId);
  }

  // ── Gateways ─────────────────────────────────────────────────────────────────

  async registerGateway(input: { farmId: number; name: string; protocol: "mqtt" | "lorawan" | "zigbee" | "ble" | "http" | "simulated"; externalId?: string; ipAddress?: string; config?: Record<string, unknown> }) {
    return gatewayService.registerGateway(input);
  }

  async getGateways(farmId: number) {
    return gatewayService.getGatewaysForFarm(farmId);
  }

  // ── Event History ────────────────────────────────────────────────────────────

  async getEventHistory(farmId: number, limit = 100) {
    return iotEventService.getEventHistory(farmId, limit);
  }

  async getDeviceEventHistory(deviceId: number, limit = 50) {
    return iotEventService.getDeviceHistory(deviceId, limit);
  }

  // ── Provider Management (admin) ───────────────────────────────────────────────

  getRegisteredProviders() {
    return providerRegistry.getSummary();
  }

  // ── Farm IoT Summary (for dashboards & Kili AI) ───────────────────────────────

  async getFarmSummary(farmId: number) {
    const devices     = await this.getDevices(farmId);
    const onlineCount  = devices.filter(d => d.status === "online").length;
    const offlineCount = devices.filter(d => d.status === "offline").length;
    
    // Compute latestReadings mapping sensorType -> { value, unit }
    const latestReadings: Record<string, { value: number; unit: string }> = {};
    const db = await getDb();
    if (db) {
      const sensors = await db.select().from(iotSensors).where(eq(iotSensors.farmId, farmId));
      const states = await db.select().from(iotSensorState).where(eq(iotSensorState.farmId, farmId));
      for (const st of states) {
        const sensor = sensors.find(s => s.id === st.sensorId);
        if (sensor && sensor.sensorType && st.latestValue != null) {
          if (!latestReadings[sensor.sensorType]) {
            latestReadings[sensor.sensorType] = { value: st.latestValue, unit: sensor.unit ?? "" };
          }
        }
      }
    }

    const unreadAlerts = await this.getAlerts(farmId, true);
    const providers    = this.getRegisteredProviders();
    return { devices, onlineCount, offlineCount, latestReadings, unreadAlerts, providers };
  }
}

export const iotCoreApi = new IotCoreApi();
