import { getDb } from "../../db";
import { farms, farmMembers, notifications, weatherCache } from "../../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";
import { IWeatherEngine, WeatherData, WeatherProvider } from "./types";
import { OpenMeteoProvider } from "./providers/openMeteo";

export class WeatherEngine implements IWeatherEngine {
  private provider: OpenMeteoProvider;
  
  // Cache durations
  private readonly CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.provider = new OpenMeteoProvider();
  }

  public async getWeatherForFarm(farmId: number): Promise<WeatherData> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [farm] = await db.select().from(farms).where(eq(farms.id, farmId));
    if (!farm) throw new Error(`Farm ${farmId} not found`);

    let lat = farm.latitude ? Number(farm.latitude) : null;
    let lon = farm.longitude ? Number(farm.longitude) : null;

    if (lat === null || lon === null) {
      const locationStr = farm.location || farm.county || "Nairobi, Kenya";
      const coords = await this.provider.getCoordinates(locationStr);
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
        // Save the resolved coordinates back to the farm
        await db.update(farms).set({ latitude: lat.toString(), longitude: lon.toString() }).where(eq(farms.id, farmId));
      } else {
        // Fallback to Nairobi if completely unresolvable
        lat = -1.2833;
        lon = 36.8167;
      }
    }

    // Check DB cache using rounded coordinates to group nearby farms
    const cacheLat = Math.round(lat * 100) / 100;
    const cacheLon = Math.round(lon * 100) / 100;

    const [cached] = await db.select()
      .from(weatherCache)
      .where(
        and(
          eq(weatherCache.latitude, cacheLat.toString()),
          eq(weatherCache.longitude, cacheLon.toString()),
          eq(weatherCache.dataType, "all")
        )
      );

    if (cached && cached.expiresAt.getTime() > Date.now()) {
      return { ...(cached.payload as WeatherData), isCached: true };
    }

    return this.refreshForecast(farmId, { lat, lon }, cacheLat, cacheLon);
  }

  public async refreshForecast(farmId: number, coords?: { lat: number; lon: number }, cacheLat?: number, cacheLon?: number): Promise<WeatherData> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let lat = coords?.lat;
      let lon = coords?.lon;

      if (lat === undefined || lon === undefined) {
        const [farm] = await db.select().from(farms).where(eq(farms.id, farmId));
        if (!farm) throw new Error(`Farm ${farmId} not found`);

        lat = farm.latitude ? Number(farm.latitude) : undefined;
        lon = farm.longitude ? Number(farm.longitude) : undefined;

        if (lat === undefined || lon === undefined) {
          const locationStr = farm.location || farm.county || "Nairobi, Kenya";
          const resCoords = await this.provider.getCoordinates(locationStr);
          lat = resCoords?.lat ?? -1.2833;
          lon = resCoords?.lon ?? 36.8167;
          await db.update(farms).set({ latitude: lat.toString(), longitude: lon.toString() }).where(eq(farms.id, farmId));
        }
      }

      const weatherData = await this.provider.getWeatherForLocation({ lat, lon });
      
      const cLat = cacheLat ?? Math.round(lat * 100) / 100;
      const cLon = cacheLon ?? Math.round(lon * 100) / 100;

      // Ensure we clean up any old cache entry for this coordinate block, or just insert new one
      // (a real system might do an upsert or delete old entries)
      await db.delete(weatherCache).where(
        and(
          eq(weatherCache.latitude, cLat.toString()),
          eq(weatherCache.longitude, cLon.toString()),
          eq(weatherCache.dataType, "all")
        )
      );

      await db.insert(weatherCache).values({
        latitude: cLat.toString(),
        longitude: cLon.toString(),
        dataType: "all",
        provider: "open-meteo",
        payload: weatherData,
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_DURATION_MS),
      });

      // Fire-and-forget: publish alerts to notifications — never let this crash the weather response
      this.evaluateAndPublishEvents(farmId, weatherData).catch(err =>
        console.warn(`[WeatherEngine] Notification publish failed for farm ${farmId}:`, err)
      );

      return { ...weatherData, isCached: false };
    } catch (error) {
      console.error(`[WeatherEngine] refreshForecast error for farm ${farmId}:`, error);
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
