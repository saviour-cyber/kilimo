import { 
  WeatherProvider, 
  WeatherData, 
  WeatherAlert, 
  WeatherCondition, 
  WeatherForecast,
  HourlyForecast,
  AgriculturalInsights
} from "../types";

export class OpenMeteoProvider implements WeatherProvider {
  private readonly baseUrl: string;
  private readonly geoUrl: string;
  private readonly archiveUrl: string;
  private readonly apiKey: string | undefined;

  constructor() {
    // Allows easy toggling to commercial endpoints via environment variables
    this.baseUrl = process.env.OPEN_METEO_API_URL || "https://api.open-meteo.com/v1";
    this.geoUrl = process.env.OPEN_METEO_GEO_URL || "https://geocoding-api.open-meteo.com/v1";
    this.archiveUrl = process.env.OPEN_METEO_ARCHIVE_URL || "https://archive-api.open-meteo.com/v1";
    this.apiKey = process.env.OPEN_METEO_API_KEY;
  }

  private buildUrl(base: string, endpoint: string, queryParams: string): string {
    const url = `${base}/${endpoint}?${queryParams}`;
    return this.apiKey ? `${url}&apikey=${this.apiKey}` : url;
  }

  public async getCoordinates(locationStr: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const url = this.buildUrl(this.geoUrl, "search", `name=${encodeURIComponent(locationStr)}&count=1`);
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return {
          lat: data.results[0].latitude,
          lon: data.results[0].longitude,
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  private getWeatherDescription(code: number): string {
    const codes: Record<number, string> = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
      55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
      71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
      95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
    };
    return codes[code] || "Unknown";
  }

  private isRainingCode(code: number): boolean {
    return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
  }

  private windDirectionFromDegrees(degrees: number): string {
    const val = Math.floor((degrees / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
  }

  private async resolveLocation(location: string | { lat: number; lon: number }): Promise<{ lat: number; lon: number }> {
    if (typeof location === "string") {
      const coords = await this.getCoordinates(location);
      return { lat: coords?.lat ?? -1.2833, lon: coords?.lon ?? 36.8167 }; // Default to Nairobi
    }
    return location;
  }

  public async getCurrentWeather(location: string | { lat: number; lon: number }): Promise<WeatherCondition> {
    const { lat, lon } = await this.resolveLocation(location);

    const url = this.buildUrl(this.baseUrl, "forecast", `latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code&timezone=auto`);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch current weather");
    const data = await response.json();
    const currentCode = data.current.weather_code;

    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: this.windDirectionFromDegrees(data.current.wind_direction_10m || 0),
      precipitation: data.current.precipitation,
      description: this.getWeatherDescription(currentCode),
      isRaining: this.isRainingCode(currentCode),
    };
  }

  public async getHourlyForecast(location: string | { lat: number; lon: number }): Promise<HourlyForecast[]> {
    const { lat, lon } = await this.resolveLocation(location);

    const url = this.buildUrl(this.baseUrl, "forecast", `latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&forecast_days=2&timezone=auto`);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch hourly forecast");
    const data = await response.json();

    const hourly: HourlyForecast[] = [];
    for (let i = 0; i < 24; i++) {
      hourly.push({
        time: data.hourly.time[i],
        temperature: data.hourly.temperature_2m[i],
        precipitationProbability: data.hourly.precipitation_probability[i],
        windSpeed: data.hourly.wind_speed_10m[i],
        description: this.getWeatherDescription(data.hourly.weather_code[i]),
      });
    }
    return hourly;
  }

  public async getDailyForecast(location: string | { lat: number; lon: number }): Promise<WeatherForecast[]> {
    const { lat, lon } = await this.resolveLocation(location);

    const url = this.buildUrl(this.baseUrl, "forecast", `latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch daily forecast");
    const data = await response.json();

    return data.daily.time.map((time: string, index: number) => ({
      date: time,
      minTemp: data.daily.temperature_2m_min[index],
      maxTemp: data.daily.temperature_2m_max[index],
      description: this.getWeatherDescription(data.daily.weather_code[index]),
      precipitationProbability: data.daily.precipitation_probability_max[index],
    })).slice(0, 7);
  }

  public async getWeatherAlerts(location: string | { lat: number; lon: number }): Promise<WeatherAlert[]> {
    const current = await this.getCurrentWeather(location);
    return this.generateAlertsFromCondition(current);
  }

  private generateAlertsFromCondition(current: WeatherCondition): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    if (current.isRaining && (current.precipitation || 0) > 10) {
      alerts.push({
        type: "precipitation",
        severity: "high",
        title: "Heavy Rainfall Warning",
        message: "Heavy rain detected.",
        description: "Significant rainfall may cause waterlogging in poorly drained fields.",
        recommendation: "Avoid spraying chemicals and ensure proper field drainage."
      });
    } else if (current.isRaining) {
      alerts.push({
        type: "precipitation",
        severity: "medium",
        title: "Active Rainfall",
        message: "Currently raining.",
        description: "Light to moderate rain.",
        recommendation: "Delay any planned chemical spraying."
      });
    }

    if (current.temperature > 35) {
      alerts.push({
        type: "temperature",
        severity: "critical",
        title: "Extreme Heat Warning",
        message: "Dangerous high temperatures.",
        description: "Temperatures exceeding 35°C can cause severe heat stress to crops and livestock.",
        recommendation: "Ensure livestock have adequate water and shade. Monitor soil moisture closely."
      });
    } else if (current.temperature < 5) {
      alerts.push({
        type: "temperature",
        severity: "high",
        title: "Frost Warning",
        message: "Very low temperatures.",
        description: "Temperatures below 5°C pose a risk of frost damage to vulnerable crops.",
        recommendation: "Cover sensitive plants if possible."
      });
    }

    if (current.windSpeed > 40) {
      alerts.push({
        type: "wind",
        severity: "high",
        title: "High Wind Alert",
        message: `Strong winds at ${current.windSpeed} km/h.`,
        description: "High winds can damage tall crops and structures.",
        recommendation: "Secure loose farm equipment and monitor vulnerable crops."
      });
    }

    return alerts;
  }

  public async getAgriculturalInsights(location: string | { lat: number; lon: number }): Promise<AgriculturalInsights> {
    const current = await this.getCurrentWeather(location);
    
    let sprayingConditions: "optimal" | "marginal" | "poor" = "optimal";
    if (current.isRaining || current.windSpeed > 20) sprayingConditions = "poor";
    else if (current.windSpeed > 10 || current.temperature > 30) sprayingConditions = "marginal";

    let irrigationNeed: "none" | "moderate" | "high" = "none";
    if (!current.isRaining && current.temperature > 25) irrigationNeed = "high";
    else if (!current.isRaining) irrigationNeed = "moderate";

    return {
      sprayingConditions,
      irrigationNeed,
      frostRisk: current.temperature < 5,
      heatStressRisk: current.temperature > 32,
    };
  }

  public async getHistoricalWeather(location: string | { lat: number; lon: number }, date: string): Promise<WeatherCondition> {
    const { lat, lon } = await this.resolveLocation(location);

    const url = this.buildUrl(this.archiveUrl, "archive", `latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_mean,precipitation_sum,wind_speed_10m_max&timezone=auto`);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch historical weather");
    const data = await response.json();

    return {
      temperature: data.daily.temperature_2m_mean[0] ?? 0,
      humidity: 0,
      windSpeed: data.daily.wind_speed_10m_max[0] ?? 0,
      isRaining: (data.daily.precipitation_sum[0] ?? 0) > 0,
      description: "Historical data",
      precipitation: data.daily.precipitation_sum[0],
    };
  }

  public async getWeatherForLocation(location: string | { lat: number; lon: number }): Promise<WeatherData> {
    const { lat, lon } = await this.resolveLocation(location);

    const url = this.buildUrl(this.baseUrl, "forecast", `latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch weather data");
    const data = await response.json();

    const currentCode = data.current.weather_code;
    const current: WeatherCondition = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: this.windDirectionFromDegrees(data.current.wind_direction_10m || 0),
      precipitation: data.current.precipitation,
      description: this.getWeatherDescription(currentCode),
      isRaining: this.isRainingCode(currentCode),
    };

    const forecast: WeatherForecast[] = data.daily.time.map((time: string, index: number) => ({
      date: time,
      minTemp: data.daily.temperature_2m_min[index],
      maxTemp: data.daily.temperature_2m_max[index],
      description: this.getWeatherDescription(data.daily.weather_code[index]),
      precipitationProbability: data.daily.precipitation_probability_max[index],
    })).slice(0, 7);

    const hourly: HourlyForecast[] = [];
    for (let i = 0; i < 24; i++) {
      hourly.push({
        time: data.hourly.time[i],
        temperature: data.hourly.temperature_2m[i],
        precipitationProbability: data.hourly.precipitation_probability[i],
        windSpeed: data.hourly.wind_speed_10m[i],
        description: this.getWeatherDescription(data.hourly.weather_code[i]),
      });
    }

    const alerts = this.generateAlertsFromCondition(current);

    let sprayingConditions: "optimal" | "marginal" | "poor" = "optimal";
    if (current.isRaining || current.windSpeed > 20) sprayingConditions = "poor";
    else if (current.windSpeed > 10 || current.temperature > 30) sprayingConditions = "marginal";

    let irrigationNeed: "none" | "moderate" | "high" = "none";
    if (!current.isRaining && current.temperature > 25) irrigationNeed = "high";
    else if (!current.isRaining) irrigationNeed = "moderate";

    const insights: AgriculturalInsights = {
      sprayingConditions,
      irrigationNeed,
      frostRisk: current.temperature < 5,
      heatStressRisk: current.temperature > 32,
    };

    return { current, forecast, hourly, alerts, insights };
  }
}
