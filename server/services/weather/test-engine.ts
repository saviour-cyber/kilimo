import "dotenv/config";
import { weatherEngine } from "./index.js";

async function run() {
  console.log("Testing WeatherEngine with farmId=1...");
  try {
    const data = await weatherEngine.getWeatherForFarm(1);
    console.log("SUCCESS:", JSON.stringify(data.current, null, 2));
    console.log("Alerts:", data.alerts.length);
    console.log("Forecast days:", data.forecast.length);
    console.log("Insights:", data.insights);
  } catch (err: any) {
    console.error("FULL ERROR:", err.message);
    console.error(err.stack);
  }
}

run();
