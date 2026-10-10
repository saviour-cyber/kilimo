import { getDb } from "../db";
import { platformServices } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type MaintenanceScope = "app_only" | "full_site";

export interface MaintenanceDetails {
  isEnabled: boolean;
  isActive: boolean;
  scope: MaintenanceScope;
  message: string;
  estimatedRestorationAt: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
}

export interface SetMaintenanceOptions {
  isEnabled: boolean;
  scope?: MaintenanceScope;
  message?: string;
  estimatedRestorationAt?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
}

let cachedMaintenanceDetails: MaintenanceDetails | null = null;
let lastCheckedAt = 0;
const CACHE_TTL_MS = 5000;

function computeIsActive(details: {
  isEnabled: boolean;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
}): boolean {
  if (details.isEnabled) return true;

  // Check scheduled window if enabled is false but window is provided
  if (details.scheduledStartAt) {
    const now = Date.now();
    const start = new Date(details.scheduledStartAt).getTime();
    if (!isNaN(start) && now >= start) {
      if (details.scheduledEndAt) {
        const end = new Date(details.scheduledEndAt).getTime();
        if (!isNaN(end) && now <= end) {
          return true;
        }
      } else {
        // Started without end date specified
        return true;
      }
    }
  }

  return false;
}

export async function isMaintenanceModeActive(db?: any): Promise<boolean> {
  const details = await getMaintenanceDetails(db);
  return details.isActive;
}

export async function getMaintenanceDetails(db?: any): Promise<MaintenanceDetails> {
  const now = Date.now();
  if (cachedMaintenanceDetails !== null && now - lastCheckedAt < CACHE_TTL_MS) {
    return cachedMaintenanceDetails;
  }

  const database = db ?? (await getDb());
  const fallback: MaintenanceDetails = {
    isEnabled: false,
    isActive: false,
    scope: "app_only",
    message: "System is currently undergoing scheduled maintenance. Please try again later.",
    estimatedRestorationAt: null,
    scheduledStartAt: null,
    scheduledEndAt: null,
  };

  if (!database) return fallback;

  try {
    const [row] = await database
      .select({ isEnabled: platformServices.isEnabled, providerConfig: platformServices.providerConfig })
      .from(platformServices)
      .where(eq(platformServices.id, "maintenance-mode"))
      .limit(1);

    const config = (row?.providerConfig as any) || {};
    const isEnabled = !!row?.isEnabled;
    const scope: MaintenanceScope = config.scope === "full_site" ? "full_site" : "app_only";
    const message = config.message || fallback.message;
    const estimatedRestorationAt = config.estimatedRestorationAt || null;
    const scheduledStartAt = config.scheduledStartAt || null;
    const scheduledEndAt = config.scheduledEndAt || null;

    const isActive = computeIsActive({
      isEnabled,
      scheduledStartAt,
      scheduledEndAt,
    });

    const details: MaintenanceDetails = {
      isEnabled,
      isActive,
      scope,
      message,
      estimatedRestorationAt,
      scheduledStartAt,
      scheduledEndAt,
    };

    cachedMaintenanceDetails = details;
    lastCheckedAt = now;
    return details;
  } catch (err) {
    console.error("[MaintenanceService] Failed to get details:", err);
    return fallback;
  }
}

export async function setMaintenanceMode(
  options: SetMaintenanceOptions,
  db?: any
): Promise<MaintenanceDetails> {
  const database = db ?? (await getDb());
  if (!database) throw new Error("Database not initialized");

  const existing = await database
    .select()
    .from(platformServices)
    .where(eq(platformServices.id, "maintenance-mode"))
    .limit(1);

  const scope: MaintenanceScope = options.scope === "full_site" ? "full_site" : "app_only";
  const message = options.message || "System is currently undergoing scheduled maintenance. Please try again later.";
  const estimatedRestorationAt = options.estimatedRestorationAt ?? null;
  const scheduledStartAt = options.scheduledStartAt ?? null;
  const scheduledEndAt = options.scheduledEndAt ?? null;

  const config = {
    scope,
    message,
    estimatedRestorationAt,
    scheduledStartAt,
    scheduledEndAt,
  };

  if (existing.length === 0) {
    await database.insert(platformServices).values({
      id: "maintenance-mode",
      name: "System Maintenance Mode",
      description: "Controls whether normal non-admin user access is frozen for maintenance.",
      isEnabled: options.isEnabled,
      providerConfig: config,
    });
  } else {
    await database
      .update(platformServices)
      .set({
        isEnabled: options.isEnabled,
        providerConfig: config,
      })
      .where(eq(platformServices.id, "maintenance-mode"));
  }

  const isActive = computeIsActive({
    isEnabled: options.isEnabled,
    scheduledStartAt,
    scheduledEndAt,
  });

  const details: MaintenanceDetails = {
    isEnabled: options.isEnabled,
    isActive,
    scope,
    message,
    estimatedRestorationAt,
    scheduledStartAt,
    scheduledEndAt,
  };

  cachedMaintenanceDetails = details;
  lastCheckedAt = Date.now();
  return details;
}
