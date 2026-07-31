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
  getCurrentWeather(locationStr: string): Promise<WeatherCondition>;
  
  /** Retrieves hourly forecast for the next 24-48 hours */
  getHourlyForecast(locationStr: string): Promise<HourlyForecast[]>;
  
  /** Retrieves 7-day daily forecast */
  getDailyForecast(locationStr: string): Promise<WeatherForecast[]>;
  
  /** Retrieves active weather alerts */
  getWeatherAlerts(locationStr: string): Promise<WeatherAlert[]>;
  
  /** Computes specific agricultural weather insights */
  getAgriculturalInsights(locationStr: string): Promise<AgriculturalInsights>;
  
  /** Retrieves historical weather data for a specific date */
  getHistoricalWeather(locationStr: string, date: string): Promise<WeatherCondition>;

  /** Legacy/Convenience method to fetch all at once (often more efficient for APIs like OpenMeteo) */
  getWeatherForLocation(locationStr: string): Promise<WeatherData>;
}

export interface IWeatherEngine {
  getWeatherForFarm(farmId: number): Promise<WeatherData>;
  getWeatherContextForAI(farmId: number): Promise<string>;
  refreshForecast(farmId: number): Promise<WeatherData>;
}
