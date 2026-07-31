import "dotenv/config";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Migrating IoT tables...");
  const db = await getDb();
  if (!db) { console.error("No DB connection"); process.exit(1); }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS iotDevices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmId INT NOT NULL,
      name VARCHAR(128) NOT NULL,
      deviceType ENUM('weather_station','soil_probe','water_sensor','livestock_collar','equipment_sensor','gateway','other') NOT NULL,
      protocol ENUM('simulated','mqtt','http','lorawan','zigbee','ble') NOT NULL DEFAULT 'simulated',
      manufacturer VARCHAR(128),
      model VARCHAR(128),
      firmwareVersion VARCHAR(64),
      status ENUM('online','offline','error','maintenance') NOT NULL DEFAULT 'offline',
      batteryLevel INT,
      location JSON,
      lastCommunicationAt TIMESTAMP NULL,
      isSimulated TINYINT(1) NOT NULL DEFAULT 1,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✓ iotDevices");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS iotSensors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      deviceId INT NOT NULL,
      farmId INT NOT NULL,
      sensorType ENUM(
        'soil_moisture','soil_temperature','soil_ph','soil_ec',
        'air_temperature','humidity','rainfall','wind_speed','solar_radiation',
        'tank_level','water_flow','irrigation_pressure','water_level',
        'livestock_temperature','activity','gps_location','feed_intake',
        'fuel_level','engine_hours','battery_voltage','maintenance_status','other'
      ) NOT NULL,
      category ENUM('soil','environmental','water','livestock','equipment') NOT NULL,
      label VARCHAR(128),
      unit VARCHAR(32),
      minVal FLOAT,
      maxVal FLOAT,
      alertMin FLOAT,
      alertMax FLOAT,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✓ iotSensors");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS iotTelemetry (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sensorId INT NOT NULL,
      deviceId INT NOT NULL,
      farmId INT NOT NULL,
      value FLOAT NOT NULL,
      metadata JSON,
      recordedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_telemetry_sensor (sensorId, recordedAt),
      INDEX idx_telemetry_farm (farmId, recordedAt)
    )
  `);
  console.log("  ✓ iotTelemetry");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS iotAlerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmId INT NOT NULL,
      sensorId INT NOT NULL,
      deviceId INT NOT NULL,
      alertType ENUM('threshold_high','threshold_low','device_offline','battery_low') NOT NULL,
      message TEXT NOT NULL,
      value FLOAT,
      isRead TINYINT(1) NOT NULL DEFAULT 0,
      resolvedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✓ iotAlerts");

  console.log("IoT tables created successfully.");
  process.exit(0);
}

main().catch(console.error);
