import { OpenMeteoProvider } from "./providers/openMeteo.js";

async function run() {
  const provider = new OpenMeteoProvider();
  try {
    const data = await provider.getWeatherForLocation("Nairobi, Kenya");
    console.log("Success:", data.current);
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

run();
