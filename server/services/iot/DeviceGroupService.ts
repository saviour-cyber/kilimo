/**
 * Device Group Service — Phase 5
 *
 * Management abstraction above individual devices.
 * Administrators organize sensors into logical groups such as:
 * "North Field", "South Field", "Greenhouse Block A", "Dairy Unit",
 * "Irrigation Zone 1", "Weather Network".
 *
 * Group-level dashboards, alerts, reporting, and bulk operations all
 * operate on these groups rather than individual devices.
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "../../db";
import {
  iotDeviceGroups, iotDeviceGroupMembers, iotDevices, iotSensorState, iotSensors,
  IotDeviceGroup, InsertIotDeviceGroup,
} from "../../../drizzle/schema";

class DeviceGroupService {

  /** Create a new device group for a farm */
  async createGroup(input: {
    farmId:      number;
    name:        string;
    description?: string;
    color?:      string;
    createdBy:   number;
  }): Promise<IotDeviceGroup> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.insert(iotDeviceGroups).values({
      farmId:      input.farmId,
      name:        input.name,
      description: input.description ?? null,
      color:       input.color ?? null,
      createdBy:   input.createdBy,
    });

    const [group] = await db.select().from(iotDeviceGroups)
      .where(and(eq(iotDeviceGroups.farmId, input.farmId), eq(iotDeviceGroups.name, input.name)))
      .limit(1);
    return group;
  }

  /** Get all groups for a farm */
  async getGroupsForFarm(farmId: number): Promise<IotDeviceGroup[]> {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(iotDeviceGroups).where(eq(iotDeviceGroups.farmId, farmId));
  }

  /** Add a device to a group */
  async addDevice(groupId: number, deviceId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    // Prevent duplicates
    const existing = await db.select().from(iotDeviceGroupMembers)
      .where(and(eq(iotDeviceGroupMembers.groupId, groupId), eq(iotDeviceGroupMembers.deviceId, deviceId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(iotDeviceGroupMembers).values({ groupId, deviceId });
    }
  }

  /** Remove a device from a group */
  async removeDevice(groupId: number, deviceId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.delete(iotDeviceGroupMembers)
      .where(and(eq(iotDeviceGroupMembers.groupId, groupId), eq(iotDeviceGroupMembers.deviceId, deviceId)));
  }

  /** Get all devices that belong to a group */
  async getGroupDevices(groupId: number) {
    const db = await getDb();
    if (!db) return [];

    const members = await db.select({ deviceId: iotDeviceGroupMembers.deviceId })
      .from(iotDeviceGroupMembers)
      .where(eq(iotDeviceGroupMembers.groupId, groupId));

    if (members.length === 0) return [];
    const deviceIds = members.map(m => m.deviceId);

    const allDevices = await db.select().from(iotDevices);
    return allDevices.filter(d => deviceIds.includes(d.id));
  }

  /** Get aggregated sensor state for every device in a group */
  async getGroupSensorState(groupId: number) {
    const db = await getDb();
    if (!db) return [];

    const devices = await this.getGroupDevices(groupId);
    if (devices.length === 0) return [];

    const deviceIds = devices.map(d => d.id);
    const farmId    = devices[0].farmId;

    const sensors = await db.select().from(iotSensors).where(eq(iotSensors.farmId, farmId));
    const groupSensors = sensors.filter(s => deviceIds.includes(s.deviceId));
    const sensorIds    = groupSensors.map(s => s.id);

    if (sensorIds.length === 0) return [];

    const states = await db.select().from(iotSensorState).where(eq(iotSensorState.farmId, farmId));

    return states
      .filter(st => sensorIds.includes(st.sensorId))
      .map(st => {
        const sensor = groupSensors.find(s => s.id === st.sensorId);
        const device = devices.find(d => d.id === st.deviceId);
        return {
          ...st,
          sensorType:  sensor?.sensorType,
          label:       sensor?.label,
          unit:        sensor?.unit,
          deviceName:  device?.name,
        };
      });
  }

  /** Delete a group (members are also removed) */
  async deleteGroup(groupId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.delete(iotDeviceGroupMembers).where(eq(iotDeviceGroupMembers.groupId, groupId));
    await db.delete(iotDeviceGroups).where(eq(iotDeviceGroups.id, groupId));
  }
}

export const deviceGroupService = new DeviceGroupService();
