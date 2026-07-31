/**
 * Gateway Service — Phase 5
 *
 * Abstraction for Edge Gateways — local hardware hubs that aggregate
 * sensor data before forwarding to the cloud. Phase 1 continues using
 * simulated devices, but this layer makes the architecture ready for
 * real MQTT brokers, LoRaWAN network servers, Zigbee coordinators, etc.
 *
 * Business Modules and providers remain completely unaware of gateway
 * topology — they interact only with devices and sensors.
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "../../db";
import {
  iotGateways, iotDevices,
  IotGateway, InsertIotGateway,
} from "../../../drizzle/schema";
import { iotEventBus, IOT_EVENTS } from "./EventBus";

class GatewayService {

  /** Register a new edge gateway for a farm */
  async registerGateway(input: {
    farmId:     number;
    name:       string;
    protocol:   "mqtt" | "lorawan" | "zigbee" | "ble" | "http" | "simulated";
    externalId?: string;
    ipAddress?:  string;
    config?:     Record<string, unknown>;
  }): Promise<IotGateway> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.insert(iotGateways).values({
      farmId:     input.farmId,
      name:       input.name,
      protocol:   input.protocol,
      externalId: input.externalId ?? null,
      ipAddress:  input.ipAddress  ?? null,
      config:     input.config     ?? null,
      status:     "offline",
    });

    const [gateway] = await db.select().from(iotGateways)
      .where(and(eq(iotGateways.farmId, input.farmId), eq(iotGateways.name, input.name)))
      .limit(1);

    iotEventBus.publish(IOT_EVENTS.GATEWAY_REGISTERED, input.farmId, "gateway_service", {
      gatewayId: gateway.id,
      name:      gateway.name,
    });

    return gateway;
  }

  /** Get all gateways for a farm */
  async getGatewaysForFarm(farmId: number): Promise<IotGateway[]> {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(iotGateways).where(eq(iotGateways.farmId, farmId));
  }

  /** Update gateway health status (called by DeviceMonitor or provider heartbeat) */
  async updateGatewayHealth(
    gatewayId: number,
    status: "online" | "offline" | "error",
    farmId: number,
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.update(iotGateways)
      .set({ status, lastSeenAt: new Date() })
      .where(eq(iotGateways.id, gatewayId));

    if (status === "offline") {
      iotEventBus.publish(IOT_EVENTS.DEVICE_OFFLINE, farmId, "gateway_service", { gatewayId });
    }
  }

  /** Get all devices connected through a gateway */
  async getGatewayDevices(gatewayId: number) {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(iotDevices).where(eq(iotDevices.gatewayId, gatewayId));
  }

  /**
   * Health check for all gateways of a farm.
   * Mark a gateway offline if it hasn't been seen in 15 minutes.
   * Called by DeviceMonitor on its 5-minute heartbeat.
   */
  async checkGatewayHealth(farmId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const gateways = await db.select().from(iotGateways)
      .where(and(eq(iotGateways.farmId, farmId), eq(iotGateways.status, "online")));

    const offlineCutoff = new Date(Date.now() - 15 * 60 * 1000);

    for (const gw of gateways) {
      if (!gw.lastSeenAt || gw.lastSeenAt < offlineCutoff) {
        await this.updateGatewayHealth(gw.id, "offline", farmId);
        console.log(`[GatewayService] Gateway ${gw.name} marked offline`);
      }
    }
  }
}

export const gatewayService = new GatewayService();
