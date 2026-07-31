import "dotenv/config";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Migrating IoT Phase 2 tables...");
  const db = await getDb();
  if (!db) { console.error("No DB connection"); process.exit(1); }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS iotSensorState (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sensorId INT NOT NULL UNIQUE,
      deviceId INT NOT NULL,
      farmId INT NOT NULL,
      latestValue FLOAT,
      latestRecordedAt TIMESTAMP NULL,
      signalStrength INT,
      batteryLevel INT,
      healthScore INT,
      lastAlertId INT,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_state_farm (farmId)
    )
  `);
  console.log("  ✓ iotSensorState");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS iotAlertRules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmId INT NOT NULL,
      name VARCHAR(128) NOT NULL,
      description TEXT,
      sensorId INT NULL,
      sensorType VARCHAR(64) NULL,
      \`condition\` ENUM('>', '<', '>=', '<=', '==', '!=') NOT NULL,
      threshold FLOAT NOT NULL,
      comparisonValue VARCHAR(64),
      severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'warning',
      priority INT NOT NULL DEFAULT 0,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      evaluationWindow INT,
      cooldownPeriod INT NOT NULL DEFAULT 60,
      messageTemplate TEXT NOT NULL,
      notificationChannels JSON,
      actionType ENUM('notify', 'task', 'webhook', 'recommendation') NOT NULL DEFAULT 'notify',
      targetModule VARCHAR(64),
      createdBy INT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_rules_farm (farmId)
    )
  `);
  console.log("  ✓ iotAlertRules");

  console.log("IoT Phase 2 tables created successfully.");
  process.exit(0);
}

main().catch(console.error);
