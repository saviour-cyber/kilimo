/**
 * Simulated IoT Provider — Phase 1
 *
 * Periodically generates realistic sensor telemetry for all simulated devices.
 * Publishes each reading to the IoT Event Bus (not to Business Modules directly).
 * Also writes telemetry to the DB and triggers alert records when thresholds are crossed.
 *
 * In Phase 2, this provider is replaced by a real MQTT/HTTP adapter — all
 * subscribers (Notifications, Reports, Kili AI) remain unchanged.
 */

import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { iotDevices, iotSensors } from "../../../drizzle/schema";
import { SensorType, SensorCategory } from "./EventBus";
import { deviceRegistry } from "./DeviceRegistry";
import { telemetryService, RawTelemetryInput } from "./TelemetryService";
import { calibrationLayer } from "./CalibrationLayer";
import { providerRegistry } from "./providers/ProviderRegistry";
import type { BaseProvider, CommandPayload, CommandResult } from "./providers/BaseProvider";

// ─── Realistic Simulation Baselines ───────────────────────────────────────────

const SENSOR_BASELINES: Record<SensorType, { base: number; drift: number }> = {
  soil_moisture:         { base: 55,  drift: 8 },
  soil_temperature:      { base: 22,  drift: 3 },
  soil_ph:               { base: 6.5, drift: 0.3 },
  soil_ec:               { base: 1.5, drift: 0.4 },
  air_temperature:       { base: 27,  drift: 5 },
  humidity:              { base: 65,  drift: 10 },
  rainfall:              { base: 0,   drift: 2 },
  wind_speed:            { base: 15,  drift: 8 },
  solar_radiation:       { base: 400, drift: 150 },
  tank_level:            { base: 70,  drift: 5 },
  water_flow:            { base: 120, drift: 20 },
  irrigation_pressure:   { base: 2.5, drift: 0.5 },
  water_level:           { base: 80,  drift: 10 },
  livestock_temperature: { base: 38.5,drift: 0.8 },
  activity:              { base: 500, drift: 200 },
  gps_location:          { base: 0,   drift: 0.001 },
  feed_intake:           { base: 5,   drift: 1 },
  fuel_level:            { base: 65,  drift: 2 },
  engine_hours:          { base: 1200,drift: 0.1 },
  battery_voltage:       { base: 12.5,drift: 0.2 },
  maintenance_status:    { base: 1,   drift: 0 },
  other:                 { base: 50,  drift: 5 },
};

function simulate(type: SensorType): number {
  const b = SENSOR_BASELINES[type] ?? { base: 50, drift: 5 };
  const value = b.base + (Math.random() - 0.5) * 2 * b.drift;
  return Math.round(value * 100) / 100;
}

function clamp(v: number, min?: number | null, max?: number | null): number {
  let result = v;
  if (min != null) result = Math.max(result, min);
  if (max != null) result = Math.min(result, max);
  return result;
}

// ─── Provider Class ────────────────────────────────────────────────────────────

export class SimulatedProvider implements BaseProvider {
  name = "SimulatedProvider";
  protocol = "simulated";
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;

  constructor(intervalMs = 30_000) {
    this.intervalMs = intervalMs;
  }

  async connect(): Promise<void> {
    if (this.intervalHandle) return;
    console.log(`[IoT] ${this.name} connected — generating telemetry every`, this.intervalMs / 1000, "s");
    this.tick();
    this.intervalHandle = setInterval(() => this.tick(), this.intervalMs);
  }

  async disconnect(): Promise<void> {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Simulated provider: commands are acknowledged but not executed on real hardware.
   * Real providers (MQTT, LoRaWAN) override this with protocol-specific logic.
   */
  async sendCommand(deviceId: number, payload: CommandPayload): Promise<CommandResult> {
    console.log(`[SimulatedProvider] Command received: ${payload.commandType} → device ${deviceId}`);
    // Simulate a short delay for realism
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, message: `Simulated: ${payload.commandType} acknowledged` };
  }

  private async tick(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      // Fetch all simulated, online-capable devices
      const devices = await db.select().from(iotDevices)
        .where(eq(iotDevices.isSimulated, true));

      if (devices.length === 0) return;

      for (const device of devices) {
        // Mark device online
        await deviceRegistry.updateDeviceStatus(device.id, "online", 75 + Math.floor(Math.random() * 25));

        // Fetch its sensors
        const sensors = await db.select().from(iotSensors)
          .where(eq(iotSensors.deviceId, device.id));

        for (const sensor of sensors) {
          if (!sensor.isActive) continue;

          const rawValue = simulate(sensor.sensorType as SensorType);
          const value = clamp(rawValue, sensor.minVal, sensor.maxVal);

          // Apply calibration before ingesting
          const calibrated = await calibrationLayer.apply(sensor.id, value);

          // Send calibrated reading to the Telemetry Service pipeline
          const input: RawTelemetryInput = {
            farmId:     sensor.farmId,
            deviceId:   device.id,
            sensorId:   sensor.id,
            sensorType: sensor.sensorType as SensorType,
            category:   sensor.category as SensorCategory,
            value:      calibrated.correctedValue,
            unit:       sensor.unit ?? "",
            metadata:   calibrated.wasCalibrated
              ? { rawValue: calibrated.rawValue, offset: calibrated.offset, multiplier: calibrated.multiplier }
              : undefined,
          };

          await telemetryService.ingest(input);
        }
      }
    } catch (err) {
      console.error(`[IoT] ${this.name} tick error:`, err);
    }
  }
}

export const simulatedProvider = new SimulatedProvider(
  parseInt(process.env.IOT_SIMULATION_INTERVAL_MS ?? "30000")
);

// Auto-register with the Provider Registry
providerRegistry.register(simulatedProvider);
