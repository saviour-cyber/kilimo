import { getDb } from "../db";
import { platformServices } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

let cachedMaintenanceStatus: boolean | null = null;
let lastCheckedAt = 0;
const CACHE_TTL_MS = 5000;

export async function isMaintenanceModeActive(db?: any): Promise<boolean> {
  const now = Date.now();
  if (cachedMaintenanceStatus !== null && now - lastCheckedAt < CACHE_TTL_MS) {
    return cachedMaintenanceStatus;
  }

  const database = db ?? (await getDb());
  if (!database) return false;

  try {
    const [row] = await database
      .select({ isEnabled: platformServices.isEnabled })
      .from(platformServices)
      .where(eq(platformServices.id, "maintenance-mode"))
      .limit(1);

    cachedMaintenanceStatus = !!row?.isEnabled;
    lastCheckedAt = now;
    return cachedMaintenanceStatus;
  } catch (err) {
    console.error("[MaintenanceService] Failed to check status:", err);
    return false;
  }
}

export async function getMaintenanceDetails(db?: any): Promise<{ isEnabled: boolean; message: string }> {
  const database = db ?? (await getDb());
  if (!database) return { isEnabled: false, message: "" };

  try {
    const [row] = await database
      .select({ isEnabled: platformServices.isEnabled, providerConfig: platformServices.providerConfig })
      .from(platformServices)
      .where(eq(platformServices.id, "maintenance-mode"))
      .limit(1);

    const config = (row?.providerConfig as any) || {};
    return {
      isEnabled: !!row?.isEnabled,
      message: config.message || "System is undergoing scheduled maintenance. Please try again later.",
    };
  } catch (err) {
    console.error("[MaintenanceService] Failed to get details:", err);
    return { isEnabled: false, message: "" };
  }
}

export async function setMaintenanceMode(
  enabled: boolean,
  message?: string,
  db?: any
): Promise<void> {
  const database = db ?? (await getDb());
  if (!database) throw new Error("Database not initialized");

  const existing = await database
    .select()
    .from(platformServices)
    .where(eq(platformServices.id, "maintenance-mode"))
    .limit(1);

  const config = {
    message: message || "System is currently undergoing scheduled maintenance. Please try again later.",
  };

  if (existing.length === 0) {
    await database.insert(platformServices).values({
      id: "maintenance-mode",
      name: "System Maintenance Mode",
      description: "Controls whether non-admin farm access is frozen for maintenance.",
      isEnabled: enabled,
      providerConfig: config,
    });
  } else {
    await database
      .update(platformServices)
      .set({
        isEnabled: enabled,
        providerConfig: config,
      })
      .where(eq(platformServices.id, "maintenance-mode"));
  }

  cachedMaintenanceStatus = enabled;
  lastCheckedAt = Date.now();
}
