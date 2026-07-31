import "dotenv/config";
import { getDb } from "../server/db";
import { deviceRegistry } from "../server/services/iot/DeviceRegistry";

/**
 * Seeds simulated IoT devices for the first farm in the database.
 * Safe to re-run — uses INSERT with device name check to avoid duplicates.
 */
async function main() {
  console.log("[IoT Seed] Starting...");
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  // Get the first farm
  const { farms } = await import("../drizzle/schema");
  const farmRows = await db.select().from(farms).limit(1);
  if (farmRows.length === 0) { console.error("No farms found. Create a farm first."); process.exit(1); }

  const farm = farmRows[0];
  console.log(`[IoT Seed] Seeding for farm: ${farm.name} (id=${farm.id})`);

  const devicesToSeed = [
    {
      farmId: farm.id, name: "Weather Station Alpha", deviceType: "weather_station" as const,
      protocol: "simulated" as const, manufacturer: "Davis Instruments", model: "Vantage Pro 2",
      isSimulated: true, location: { lat: -1.286389, lng: 36.817223, label: "Farm North Corner" },
    },
    {
      farmId: farm.id, name: "Field A Soil Probe", deviceType: "soil_probe" as const,
      protocol: "simulated" as const, manufacturer: "Sentek", model: "Drill & Drop",
      isSimulated: true, location: { lat: -1.287000, lng: 36.818000, label: "Field A" },
    },
    {
      farmId: farm.id, name: "Field B Soil Probe", deviceType: "soil_probe" as const,
      protocol: "simulated" as const, manufacturer: "Sentek", model: "Drill & Drop",
      isSimulated: true, location: { lat: -1.289000, lng: 36.819000, label: "Field B" },
    },
    {
      farmId: farm.id, name: "Main Water Tank Monitor", deviceType: "water_sensor" as const,
      protocol: "simulated" as const, manufacturer: "Floatless Relay", model: "FLR-100",
      isSimulated: true, location: { lat: -1.285000, lng: 36.816000, label: "Main Tank" },
    },
    {
      farmId: farm.id, name: "Livestock Collar #001", deviceType: "livestock_collar" as const,
      protocol: "simulated" as const, manufacturer: "SCR by Allflex", model: "HR Tag",
      isSimulated: true, location: { lat: -1.290000, lng: 36.820000, label: "Grazing Area" },
    },
    {
      farmId: farm.id, name: "Tractor Sensor Unit", deviceType: "equipment_sensor" as const,
      protocol: "simulated" as const, manufacturer: "John Deere", model: "AMS",
      isSimulated: true, location: { lat: -1.286500, lng: 36.817500, label: "Equipment Shed" },
    },
  ];

  for (const deviceInput of devicesToSeed) {
    try {
      const { device, sensors } = await deviceRegistry.registerDevice(deviceInput);
      console.log(`  ✓ Registered: ${device.name} (${sensors.length} sensors)`);
    } catch (err: any) {
      console.warn(`  ⚠ Skipped (may already exist): ${deviceInput.name} — ${err.message}`);
    }
  }

  console.log("[IoT Seed] Done.");
  process.exit(0);
}

main().catch(console.error);
