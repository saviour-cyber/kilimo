import { getDb } from "../../db";
import { farms, farmMembers, notifications } from "../../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";
import { IWeatherEngine, WeatherData, WeatherProvider } from "./types";
import { OpenMeteoProvider } from "./providers/openMeteo";

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

export class WeatherEngine implements IWeatherEngine {
  private provider: WeatherProvider;
  private cache: Map<number, CacheEntry>;
  
  // Cache durations
  private readonly CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.provider = new OpenMeteoProvider();
    this.cache = new Map();
  }

  public async getWeatherForFarm(farmId: number): Promise<WeatherData> {
    const cached = this.cache.get(farmId);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION_MS)) {
      return { ...cached.data, isCached: true };
    }

    return this.refreshForecast(farmId);
  }

  public async refreshForecast(farmId: number): Promise<WeatherData> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [farm] = await db.select().from(farms).where(eq(farms.id, farmId));
      if (!farm) throw new Error(`Farm ${farmId} not found`);

      // Use the stored location string, falling back to county/sub-county, then default
      const locationStr = farm.location || farm.county || "Nairobi, Kenya";
      
      const weatherData = await this.provider.getWeatherForLocation(locationStr);
      
      // Update Cache
      this.cache.set(farmId, {
        data: weatherData,
        timestamp: Date.now()
      });

      // Fire-and-forget: publish alerts to notifications — never let this crash the weather response
      this.evaluateAndPublishEvents(farmId, weatherData).catch(err =>
        console.warn(`[WeatherEngine] Notification publish failed for farm ${farmId}:`, err)
      );

      return { ...weatherData, isCached: false };
    } catch (error) {
      console.error(`[WeatherEngine] refreshForecast error for farm ${farmId}:`, error);
      // Graceful fallback to cache even if expired
      const cached = this.cache.get(farmId);
      if (cached) {
        console.warn(`[WeatherEngine] Serving stale cache for farm ${farmId}`);
        return { ...cached.data, isCached: true };
      }
      throw error;
    }
  }

  private async evaluateAndPublishEvents(farmId: number, weatherData: WeatherData) {
    const db = await getDb();
    if (!db) return;

    // Filter only high/critical alerts
    const criticalAlerts = weatherData.alerts.filter(a => a.severity === "high" || a.severity === "critical");
    
    if (criticalAlerts.length === 0) return;

    // Check if we already sent these alerts recently (within last 6 hours) to avoid spam
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    const recentNotifs = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.farmId, farmId),
          eq(notifications.category, "system"), // we use system for weather
          gte(notifications.createdAt, sixHoursAgo)
        )
      );

    const members = await db.select().from(farmMembers).where(eq(farmMembers.farmId, farmId));

    for (const alert of criticalAlerts) {
      // Avoid duplicate notifications
      const alreadySent = recentNotifs.some(n => n.title === `Weather Alert: ${alert.title}`);
      if (alreadySent) continue;

      const notifInserts = members.map(m => ({
        farmId,
        userId: m.userId,
        title: `Weather Alert: ${alert.title || alert.type}`,
        message: `${alert.message} ${alert.recommendation || ""}`,
        type: alert.severity === "critical" ? "alert" : "warning",
        category: "system" as const,
      }));

      if (notifInserts.length > 0) {
        // We use 'as any' to bypass the type assertion error if 'type' union mismatch occurs in strict modes
        await db.insert(notifications).values(notifInserts as any);
      }
    }
  }

  public async getWeatherContextForAI(farmId: number): Promise<string> {
    try {
      const weather = await this.getWeatherForFarm(farmId);
      let ctx = `[Weather Context]\n`;
      ctx += `Current: ${weather.current.temperature}°C, ${weather.current.humidity}% humidity, ${weather.current.description}. Wind: ${weather.current.windSpeed} km/h.\n`;
      if (weather.insights) {
        ctx += `Spraying Conditions: ${weather.insights.sprayingConditions}\n`;
        ctx += `Irrigation Need: ${weather.insights.irrigationNeed}\n`;
        ctx += `Frost Risk: ${weather.insights.frostRisk ? "Yes" : "No"}\n`;
        ctx += `Heat Stress Risk: ${weather.insights.heatStressRisk ? "Yes" : "No"}\n`;
      }
      if (weather.alerts.length > 0) {
        ctx += `Active Alerts: ${weather.alerts.map(a => a.title || a.type).join(", ")}\n`;
      }
      return ctx;
    } catch (error) {
      return `[Weather Context]\nUnable to retrieve weather data.`;
    }
  }
}

// Export a singleton instance
export const weatherEngine = new WeatherEngine();
