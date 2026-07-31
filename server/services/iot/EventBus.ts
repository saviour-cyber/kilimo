/**
 * IoT Event Bus — Phase 1 (Node.js EventEmitter)
 *
 * This is the internal message broker for the IoT Engine.
 * All Business Modules, Platform Services, and Kili AI must consume
 * IoT data through this bus rather than querying hardware or DB directly.
 *
 * Architecture contract:
 *   - Publishers: SimulatedProvider (and future MQTT/LoRaWAN adapters)
 *   - Subscribers: Notifications Service, Reports Hub, Weather Service,
 *                  Disease Detection, Kili AI, Irrigation Module
 *
 * Future upgrade path: Replace EventEmitter with Redis Streams / RabbitMQ / Kafka
 * by only changing this file — all subscribers remain untouched.
 */

import { EventEmitter } from "events";

// ─── Telemetry Event Shape ─────────────────────────────────────────────────────

export type SensorCategory = "soil" | "environmental" | "water" | "livestock" | "equipment";

export type SensorType =
  | "soil_moisture" | "soil_temperature" | "soil_ph" | "soil_ec"
  | "air_temperature" | "humidity" | "rainfall" | "wind_speed" | "solar_radiation"
  | "tank_level" | "water_flow" | "irrigation_pressure" | "water_level"
  | "livestock_temperature" | "activity" | "gps_location" | "feed_intake"
  | "fuel_level" | "engine_hours" | "battery_voltage" | "maintenance_status"
  | "other";

export interface TelemetryEvent {
  farmId:     number;
  deviceId:   number;
  sensorId:   number;
  sensorType: SensorType;
  category:   SensorCategory;
  value:      number;
  unit:       string;
  label:      string;
  metadata?:  Record<string, unknown>;   // GPS coords, etc.
  recordedAt: Date;
  // Threshold breach info — populated by the engine before publishing
  alertType?: "threshold_high" | "threshold_low" | "battery_low" | "device_offline";
  alertMin?:  number;
  alertMax?:  number;
}

// ─── Event Names ───────────────────────────────────────────────────────────────

export interface StandardIotEvent<T = any> {
  type: string;
  farmId: number;
  timestamp: Date;
  source: string;       // e.g. "simulated_provider", "alert_engine", "device_monitor"
  payload: T;
}

export const IOT_EVENTS = {
  TELEMETRY_RECEIVED:   "iot:telemetry:received",
  DEVICE_ONLINE:        "iot:device:online",
  DEVICE_OFFLINE:       "iot:device:offline",
  LOW_BATTERY:          "iot:device:low_battery",
  THRESHOLD_EXCEEDED:   "iot:alert:threshold_exceeded",
  ALERT_CREATED:        "iot:alert:created",
  DEVICE_REGISTERED:    "iot:device:registered",
  // Phase 5
  COMMAND_EXECUTED:     "iot:command:executed",
  GATEWAY_REGISTERED:   "iot:gateway:registered",
  CALIBRATION_UPDATED:  "iot:sensor:calibration_updated",
} as const;

// ─── Payload Types ─────────────────────────────────────────────────────────────

export interface TelemetryPayload {
  deviceId:   number;
  sensorId:   number;
  sensorType: SensorType;
  category:   SensorCategory;
  value:      number;
  unit:       string;
}

export interface DeviceStatusPayload {
  deviceId: number;
  batteryLevel?: number;
}

export interface ThresholdExceededPayload {
  ruleId:     number;
  sensorId:   number;
  deviceId:   number;
  value:      number;
  threshold:  number;
  condition:  string;
}

// ─── Bus Singleton ─────────────────────────────────────────────────────────────

class IotEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish<T>(type: string, farmId: number, source: string, payload: T): void {
    const event: StandardIotEvent<T> = {
      type, farmId, timestamp: new Date(), source, payload
    };
    this.emit(type, event);
  }

  subscribe<T>(type: string, handler: (event: StandardIotEvent<T>) => void): void {
    this.on(type, handler);
  }
}

export const iotEventBus = new IotEventBus();
