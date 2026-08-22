export interface WeatherCondition {
  temperature: number;
  humidity: number;
  description: string;
  isRaining: boolean;
  windSpeed: number;
  windDirection?: string;
  precipitation?: number;
}

export interface WeatherForecast {
  date: string;
  minTemp: number;
  maxTemp: number;
  description: string;
  precipitationProbability: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  precipitationProbability: number;
  windSpeed: number;
  description: string;
}

export interface WeatherAlert {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  title?: string;
  description?: string;
  recommendation?: string;
  startsAt?: string;
}

export interface AgriculturalInsights {
  sprayingConditions: "optimal" | "marginal" | "poor";
  irrigationNeed: "none" | "moderate" | "high";
  frostRisk: boolean;
  heatStressRisk: boolean;
}

export interface WeatherData {
  current: WeatherCondition;
  forecast: WeatherForecast[]; // daily
  hourly?: HourlyForecast[];
  alerts: WeatherAlert[];
  insights?: AgriculturalInsights;
  isCached?: boolean;
}

export interface WeatherProvider {
  /** Retrieves only current conditions */
  getCurrentWeather(location: string | { lat: number; lon: number }): Promise<WeatherCondition>;
  
  /** Retrieves hourly forecast for the next 24-48 hours */
  getHourlyForecast(location: string | { lat: number; lon: number }): Promise<HourlyForecast[]>;
  
  /** Retrieves 7-day daily forecast */
  getDailyForecast(location: string | { lat: number; lon: number }): Promise<WeatherForecast[]>;
  
  /** Retrieves active weather alerts */
  getWeatherAlerts(location: string | { lat: number; lon: number }): Promise<WeatherAlert[]>;
  
  /** Computes specific agricultural weather insights */
  getAgriculturalInsights(location: string | { lat: number; lon: number }): Promise<AgriculturalInsights>;
  
  /** Retrieves historical weather data for a specific date */
  getHistoricalWeather(location: string | { lat: number; lon: number }, date: string): Promise<WeatherCondition>;

  /** Legacy/Convenience method to fetch all at once (often more efficient for APIs like OpenMeteo) */
  getWeatherForLocation(location: string | { lat: number; lon: number }): Promise<WeatherData>;
}

export interface IWeatherEngine {
  getWeatherForFarm(farmId: number): Promise<WeatherData>;
  getWeatherContextForAI(farmId: number): Promise<string>;
  refreshForecast(farmId: number): Promise<WeatherData>;
}
