/**
 * Command Service — Phase 5
 *
 * Centralized bidirectional command pipeline.
 * Business Modules never talk to devices directly — they call this service.
 * Commands are routed through the Provider Registry based on the device's protocol.
 * All commands are persisted to iotCommands for auditing and status tracking.
 */

import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { iotDevices, iotCommands } from "../../../drizzle/schema";
import { providerRegistry } from "./providers/ProviderRegistry";
import { iotEventBus, IOT_EVENTS } from "./EventBus";
import type { CommandType } from "./providers/BaseProvider";

export interface SendCommandInput {
  farmId:      number;
  deviceId:    number;
  issuedBy:    number;  // userId
  commandType: CommandType;
  params?:     Record<string, unknown>;
}

export interface SendCommandOutput {
  commandId: number;
  success:   boolean;
  message?:  string;
}

class CommandService {
  async sendCommand(input: SendCommandInput): Promise<SendCommandOutput> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // 1. Look up device to get its protocol
    const [device] = await db.select()
      .from(iotDevices)
      .where(eq(iotDevices.id, input.deviceId))
      .limit(1);

    if (!device) {
      throw new Error(`Device ${input.deviceId} not found`);
    }

    // 2. Create command record (pending)
    const [insertResult] = await db.insert(iotCommands).values({
      farmId:      input.farmId,
      deviceId:    input.deviceId,
      issuedBy:    input.issuedBy,
      commandType: input.commandType,
      params:      input.params ?? null,
      status:      "pending",
    });
    const commandId = insertResult.insertId;

    // 3. Route to the appropriate provider
    const provider = providerRegistry.get(device.protocol);

    if (!provider) {
      await db.update(iotCommands)
        .set({ status: "failed", result: `No provider registered for protocol: ${device.protocol}` })
        .where(eq(iotCommands.id, commandId));
      return { commandId, success: false, message: `No provider for protocol: ${device.protocol}` };
    }

    try {
      // 4. Mark as sent
      await db.update(iotCommands)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(iotCommands.id, commandId));

      // 5. Execute via provider
      const result = await provider.sendCommand(input.deviceId, {
        commandType: input.commandType,
        params:      input.params,
      });

      // 6. Update command record with result
      await db.update(iotCommands)
        .set({
          status:      result.success ? "completed" : "failed",
          result:      result.message ?? (result.success ? "OK" : "Provider error"),
          completedAt: new Date(),
        })
        .where(eq(iotCommands.id, commandId));

      // 7. Publish event
      iotEventBus.publish(IOT_EVENTS.COMMAND_EXECUTED, input.farmId, "command_service", {
        commandId,
        deviceId:    input.deviceId,
        commandType: input.commandType,
        success:     result.success,
      });

      return { commandId, success: result.success, message: result.message };
    } catch (err: any) {
      await db.update(iotCommands)
        .set({ status: "failed", result: String(err?.message ?? err) })
        .where(eq(iotCommands.id, commandId));
      return { commandId, success: false, message: String(err?.message ?? err) };
    }
  }

  /** Retrieve command history for a device */
  async getCommandHistory(deviceId: number, limit = 50) {
    const db = await getDb();
    if (!db) return [];
    const { desc } = await import("drizzle-orm");
    return db.select().from(iotCommands)
      .where(eq(iotCommands.deviceId, deviceId))
      .orderBy(desc(iotCommands.createdAt))
      .limit(limit);
  }
}

export const commandService = new CommandService();
