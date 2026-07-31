/**
 * IoT Provider Interface — Phase 5
 *
 * Every provider (Simulated, MQTT, LoRaWAN, HTTP, BLE, Zigbee) must
 * implement this interface and register with the ProviderRegistry.
 */

export type CommandType =
  | "irrigation_on" | "irrigation_off"
  | "valve_open"    | "valve_close"
  | "device_restart"| "sensor_calibrate"
  | "request_telemetry" | "firmware_update"
  | "set_reporting_interval";

export interface CommandPayload {
  commandType: CommandType;
  params?: Record<string, unknown>;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export interface BaseProvider {
  /** Human-readable provider name */
  name: string;
  /** The protocol this provider handles */
  protocol: string;

  /** Start the provider (open connections, start polling, etc.) */
  connect(): Promise<void>;

  /** Gracefully shut down the provider */
  disconnect(): Promise<void>;

  /**
   * Send a command to a specific device through this provider.
   * Returns a result indicating success or failure.
   * Providers that don't support commands should return { success: false, message: "Not supported" }
   */
  sendCommand(deviceId: number, payload: CommandPayload): Promise<CommandResult>;
}
