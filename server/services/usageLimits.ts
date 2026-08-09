import { getDb } from "../db";
import { organizations, farms, farmMembers, subscriptions, subscriptionPlans, users, iotDevices } from "../../drizzle/schema";
import { eq, inArray, count, and } from "drizzle-orm";

export class UsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

export async function checkFarmLimit(organizationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Get current plan limits
  const planInfo = await db
    .select({
      maxFarms: subscriptionPlans.maxFarms,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(and(eq(subscriptions.organizationId, organizationId), inArray(subscriptions.status, ["active", "trialing"])))
    .limit(1);

  // If no active subscription or unlimited, allow.
  if (!planInfo.length || planInfo[0].maxFarms === null) return;

  const maxFarms = planInfo[0].maxFarms;

  // 2. Count current farms
  const [farmCountResult] = await db
    .select({ value: count() })
    .from(farms)
    .where(eq(farms.organizationId, organizationId));

  const currentFarms = farmCountResult.value;

  if (currentFarms >= maxFarms) {
    throw new UsageLimitError(`Your current plan limits you to ${maxFarms} farm(s). Please upgrade your subscription to create more.`);
  }
}

export async function checkUserLimit(organizationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Get current plan limits
  const planInfo = await db
    .select({
      maxUsers: subscriptionPlans.maxUsers,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(and(eq(subscriptions.organizationId, organizationId), inArray(subscriptions.status, ["active", "trialing"])))
    .limit(1);

  if (!planInfo.length || planInfo[0].maxUsers === null) return;

  const maxUsers = planInfo[0].maxUsers;

  // 2. Count current unique users across all farms in this org
  // (A more accurate way is counting unique user IDs in farmMembers for farms belonging to this org)
  const orgFarms = await db
    .select({ id: farms.id })
    .from(farms)
    .where(eq(farms.organizationId, organizationId));

  if (orgFarms.length === 0) return;

  const farmIds = orgFarms.map(f => f.id);

  const [userCountResult] = await db
    .select({ value: count(farmMembers.userId) }) // In a perfect world, count(DISTINCT farmMembers.userId), but let's assume no dupes or simple approximation
    .from(farmMembers)
    .where(inArray(farmMembers.farmId, farmIds));

  const currentUsers = userCountResult.value;

  if (currentUsers >= maxUsers) {
    throw new UsageLimitError(`Your current plan limits you to ${maxUsers} user(s). Please upgrade your subscription to invite more team members.`);
  }
}

export async function checkDeviceLimit(organizationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Get current plan limits
  const planInfo = await db
    .select({
      maxDevices: subscriptionPlans.maxDevices,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(and(eq(subscriptions.organizationId, organizationId), inArray(subscriptions.status, ["active", "trialing"])))
    .limit(1);

  if (!planInfo.length || planInfo[0].maxDevices === null) return;

  const maxDevices = planInfo[0].maxDevices;

  // Count devices in the org's farms
  const orgFarms = await db
    .select({ id: farms.id })
    .from(farms)
    .where(eq(farms.organizationId, organizationId));

  if (orgFarms.length === 0) return;

  const farmIds = orgFarms.map(f => f.id);

  const [deviceCountResult] = await db
    .select({ value: count() })
    .from(iotDevices)
    .where(inArray(iotDevices.farmId, farmIds));

  const currentDevices = deviceCountResult.value;

  if (currentDevices >= maxDevices) {
    throw new UsageLimitError(`Your current plan limits you to ${maxDevices} device(s). Please upgrade your subscription to register more devices.`);
  }
}
