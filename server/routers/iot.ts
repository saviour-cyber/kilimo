/**
 * IoT tRPC Router — Phase 5
 *
 * ALL procedures route exclusively through iotCoreApi.
 * No direct imports from DeviceRegistry, TelemetryService, or internal IoT services.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { iotCoreApi } from "../services/iot/IotCoreApi";

export const iotRouter = router({

  // ── Device Management ──────────────────────────────────────────────────────

  getDevices: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => iotCoreApi.getDevices(input.farmId)),

  registerDevice: protectedProcedure
    .input(z.object({
      farmId:      z.number(),
      name:        z.string(),
      deviceType:  z.enum(["weather_station","soil_probe","water_sensor","livestock_collar","equipment_sensor","gateway","other"]),
      protocol:    z.enum(["simulated","mqtt","http","lorawan","zigbee","ble"]).default("simulated"),
      manufacturer:z.string().optional(),
      model:       z.string().optional(),
      isSimulated: z.boolean().default(true),
      location:    z.object({ lat: z.number(), lng: z.number(), label: z.string().optional() }).optional(),
    }))
    .mutation(async ({ input }) => {
      return iotCoreApi.registerDevice({
        ...input,
        status: "online",
        location: input.location ?? null,
      });
    }),

  // ── Sensor Queries ─────────────────────────────────────────────────────────

  getFarmSensors: protectedProcedure
    .input(z.object({ farmId: z.number(), category: z.string().optional() }))
    .query(async ({ input }) => iotCoreApi.getFarmSensors(input.farmId, input.category)),

  getSensorCalibration: protectedProcedure
    .input(z.object({ sensorId: z.number() }))
    .query(async ({ input }) => iotCoreApi.getSensorCalibration(input.sensorId)),

  updateCalibration: protectedProcedure
    .input(z.object({
      sensorId:   z.number(),
      farmId:     z.number(),
      offset:     z.number(),
      multiplier: z.number(),
      method:     z.string(),
      notes:      z.string().optional(),
      nextCalibrationAt: z.string().optional(), // ISO date string
    }))
    .mutation(async ({ input, ctx }) => {
      return iotCoreApi.updateCalibration({
        ...input,
        calibratedBy:     ctx.user.id,
        nextCalibrationAt: input.nextCalibrationAt ? new Date(input.nextCalibrationAt) : undefined,
      });
    }),

  // ── Telemetry ──────────────────────────────────────────────────────────────

  getLatestTelemetry: protectedProcedure
    .input(z.object({ farmId: z.number(), sensorId: z.number().optional() }))
    .query(async ({ input }) => iotCoreApi.getSensorState(input.farmId, input.sensorId)),

  getTelemetryHistory: protectedProcedure
    .input(z.object({ farmId: z.number(), sensorId: z.number(), hours: z.number().default(24) }))
    .query(async ({ input }) => iotCoreApi.getTelemetryHistory(input.farmId, input.sensorId, input.hours)),

  // ── Summary (Dashboard & Kili AI) ─────────────────────────────────────────

  getFarmIoTSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => iotCoreApi.getFarmSummary(input.farmId)),

  // ── Alerts ─────────────────────────────────────────────────────────────────

  getAlerts: protectedProcedure
    .input(z.object({ farmId: z.number(), unreadOnly: z.boolean().default(true) }))
    .query(async ({ input }) => iotCoreApi.getAlerts(input.farmId, input.unreadOnly)),

  markAlertRead: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      await iotCoreApi.markAlertRead(input.alertId);
      return { success: true };
    }),

  // ── Alert Rules ────────────────────────────────────────────────────────────

  getAlertRules: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => iotCoreApi.getAlertRules(input.farmId)),

  createAlertRule: protectedProcedure
    .input(z.object({
      farmId:          z.number(),
      name:            z.string(),
      sensorType:      z.string().optional(),
      condition:       z.enum([">", "<", ">=", "<=", "==", "!="]),
      threshold:       z.number(),
      severity:        z.enum(["info", "warning", "critical"]),
      actionType:      z.enum(["notify", "task", "webhook", "recommendation"]),
      messageTemplate: z.string(),
      webhookUrl:      z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { iotAlertRules } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(iotAlertRules).values({ ...input, createdBy: ctx.user.id });
      return { id: result.insertId };
    }),

  updateAlertRule: protectedProcedure
    .input(z.object({ id: z.number(), enabled: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { iotAlertRules } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(iotAlertRules)
        .set({ ...(input.enabled !== undefined ? { enabled: input.enabled } : {}) })
        .where(eq(iotAlertRules.id, input.id));
      return { success: true };
    }),

  deleteAlertRule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { iotAlertRules } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(iotAlertRules).where(eq(iotAlertRules.id, input.id));
      return { success: true };
    }),

  // ── Commands ───────────────────────────────────────────────────────────────

  sendCommand: protectedProcedure
    .input(z.object({
      farmId:      z.number(),
      deviceId:    z.number(),
      commandType: z.enum([
        "irrigation_on","irrigation_off","valve_open","valve_close",
        "device_restart","sensor_calibrate","request_telemetry",
        "firmware_update","set_reporting_interval",
      ]),
      params: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return iotCoreApi.sendCommand({ ...input, issuedBy: ctx.user.id });
    }),

  getCommandHistory: protectedProcedure
    .input(z.object({ deviceId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => iotCoreApi.getCommandHistory(input.deviceId, input.limit)),

  // ── Device Groups ──────────────────────────────────────────────────────────

  getGroups: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => iotCoreApi.getGroups(input.farmId)),

  createGroup: protectedProcedure
    .input(z.object({
      farmId:      z.number(),
      name:        z.string(),
      description: z.string().optional(),
      color:       z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => iotCoreApi.createGroup({ ...input, createdBy: ctx.user.id })),

  addDeviceToGroup: protectedProcedure
    .input(z.object({ groupId: z.number(), deviceId: z.number() }))
    .mutation(async ({ input }) => {
      await iotCoreApi.addDeviceToGroup(input.groupId, input.deviceId);
      return { success: true };
    }),

  removeDeviceFromGroup: protectedProcedure
    .input(z.object({ groupId: z.number(), deviceId: z.number() }))
    .mutation(async ({ input }) => {
      await iotCoreApi.removeDeviceFromGroup(input.groupId, input.deviceId);
      return { success: true };
    }),

  getGroupSensorState: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => iotCoreApi.getGroupSensorState(input.groupId)),

  // ── Digital Twins ──────────────────────────────────────────────────────────

  getTwins: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => iotCoreApi.getTwins(input.farmId)),

  registerTwin: protectedProcedure
    .input(z.object({
      farmId:      z.number(),
      label:       z.string(),
      entityType:  z.enum(["field","paddock","greenhouse","livestock_shed","water_tank","irrigation_zone","equipment_yard","other"]),
      entityId:    z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => iotCoreApi.registerTwin(input)),

  getTwinSensorState: protectedProcedure
    .input(z.object({ twinId: z.number() }))
    .query(async ({ input }) => iotCoreApi.getTwinSensorState(input.twinId)),

  assignDeviceToTwin: protectedProcedure
    .input(z.object({ deviceId: z.number(), twinId: z.number() }))
    .mutation(async ({ input }) => {
      await iotCoreApi.assignDeviceToTwin(input.deviceId, input.twinId);
      return { success: true };
    }),

  // ── Gateways ───────────────────────────────────────────────────────────────

  getGateways: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => iotCoreApi.getGateways(input.farmId)),

  registerGateway: protectedProcedure
    .input(z.object({
      farmId:     z.number(),
      name:       z.string(),
      protocol:   z.enum(["mqtt","lorawan","zigbee","ble","http","simulated"]),
      externalId: z.string().optional(),
      ipAddress:  z.string().optional(),
    }))
    .mutation(async ({ input }) => iotCoreApi.registerGateway(input)),

  // ── Event History ──────────────────────────────────────────────────────────

  getEventHistory: protectedProcedure
    .input(z.object({ farmId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => iotCoreApi.getEventHistory(input.farmId, input.limit)),

  getDeviceEventHistory: protectedProcedure
    .input(z.object({ deviceId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => iotCoreApi.getDeviceEventHistory(input.deviceId, input.limit)),

  // ── Provider Management ────────────────────────────────────────────────────

  getProviders: protectedProcedure
    .query(() => iotCoreApi.getRegisteredProviders()),
});
