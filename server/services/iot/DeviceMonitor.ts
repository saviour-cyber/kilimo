import { getDb } from "../../db";
import { iotDevices } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { iotEventBus, IOT_EVENTS, DeviceStatusPayload } from "./EventBus";

export class DeviceMonitor {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly checkIntervalMs = 60_000 * 5; // Every 5 minutes
  private readonly offlineThresholdMs = 60_000 * 15; // 15 minutes of silence = offline

  start(): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => this.checkDevices(), this.checkIntervalMs);
    console.log("[IoT] DeviceMonitor started");
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async checkDevices(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const now = new Date();
      const offlineCutoff = new Date(now.getTime() - this.offlineThresholdMs);

      // Find devices currently marked "online" but haven't communicated recently
      const onlineDevices = await db.select().from(iotDevices).where(eq(iotDevices.status, "online"));

      for (const device of onlineDevices) {
        if (!device.lastCommunicationAt || device.lastCommunicationAt < offlineCutoff) {
          // Mark offline
          await db.update(iotDevices).set({ status: "offline" }).where(eq(iotDevices.id, device.id));
          
          // Publish event
          iotEventBus.publish<DeviceStatusPayload>(
            IOT_EVENTS.DEVICE_OFFLINE,
            device.farmId,
            "device_monitor",
            { deviceId: device.id, batteryLevel: device.batteryLevel ?? undefined }
          );
        } else if (device.batteryLevel != null && device.batteryLevel < 15) {
          // Battery low
          iotEventBus.publish<DeviceStatusPayload>(
            IOT_EVENTS.LOW_BATTERY,
            device.farmId,
            "device_monitor",
            { deviceId: device.id, batteryLevel: device.batteryLevel }
          );
        }
      }
    } catch (err) {
      console.error("[DeviceMonitor] Error checking devices:", err);
    }
  }
}

export const deviceMonitor = new DeviceMonitor();
