import "dotenv/config";
import mysql from "mysql2/promise";

async function run(connection: mysql.Connection, sql: string, description: string) {
  try {
    await connection.execute(sql);
    console.log(`✅ ${description}`);
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME" || e.code === "ER_TABLE_EXISTS_ERROR" || e.code === "ER_DUP_KEYNAME") {
      console.log(`⏭️  Already exists: ${description}`);
    } else {
      throw e;
    }
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const connection = await mysql.createConnection(url);
  console.log("Connected. Running Phase 5 IoT migrations...\n");

  // ─── Extend iotDevices ────────────────────────────────────────────────────
  await run(connection, `ALTER TABLE iotDevices ADD COLUMN gatewayId INT`, "iotDevices.gatewayId");
  await run(connection, `ALTER TABLE iotDevices ADD COLUMN groupId INT`,   "iotDevices.groupId");
  await run(connection, `ALTER TABLE iotDevices ADD COLUMN twinId INT`,    "iotDevices.twinId");

  // ─── Extend iotSensors ────────────────────────────────────────────────────
  await run(connection, `ALTER TABLE iotSensors ADD COLUMN calibrationOffset FLOAT DEFAULT 0`,     "iotSensors.calibrationOffset");
  await run(connection, `ALTER TABLE iotSensors ADD COLUMN calibrationMultiplier FLOAT DEFAULT 1`, "iotSensors.calibrationMultiplier");
  await run(connection, `ALTER TABLE iotSensors ADD COLUMN calibrationMethod VARCHAR(64)`,         "iotSensors.calibrationMethod");
  await run(connection, `ALTER TABLE iotSensors ADD COLUMN calibrationStatus ENUM('ok','due','overdue','uncalibrated') DEFAULT 'uncalibrated'`, "iotSensors.calibrationStatus");
  await run(connection, `ALTER TABLE iotSensors ADD COLUMN lastCalibratedAt DATETIME`,             "iotSensors.lastCalibratedAt");
  await run(connection, `ALTER TABLE iotSensors ADD COLUMN nextCalibrationAt DATETIME`,            "iotSensors.nextCalibrationAt");

  // ─── iotGateways ──────────────────────────────────────────────────────────
  await run(connection, `
    CREATE TABLE IF NOT EXISTS iotGateways (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      farmId          INT NOT NULL,
      name            VARCHAR(128) NOT NULL,
      protocol        ENUM('mqtt','lorawan','zigbee','ble','http','simulated') DEFAULT 'mqtt' NOT NULL,
      externalId      VARCHAR(128),
      status          ENUM('online','offline','error') DEFAULT 'offline' NOT NULL,
      config          JSON,
      lastSeenAt      DATETIME,
      ipAddress       VARCHAR(64),
      firmwareVersion VARCHAR(64),
      createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `, "CREATE TABLE iotGateways");

  // ─── iotDeviceGroups ──────────────────────────────────────────────────────
  await run(connection, `
    CREATE TABLE IF NOT EXISTS iotDeviceGroups (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      farmId      INT NOT NULL,
      name        VARCHAR(128) NOT NULL,
      description TEXT,
      color       VARCHAR(16),
      createdBy   INT NOT NULL,
      createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `, "CREATE TABLE iotDeviceGroups");

  await run(connection, `
    CREATE TABLE IF NOT EXISTS iotDeviceGroupMembers (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      groupId   INT NOT NULL,
      deviceId  INT NOT NULL,
      addedAt   DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `, "CREATE TABLE iotDeviceGroupMembers");

  // ─── iotDigitalTwins ──────────────────────────────────────────────────────
  await run(connection, `
    CREATE TABLE IF NOT EXISTS iotDigitalTwins (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      farmId      INT NOT NULL,
      label       VARCHAR(128) NOT NULL,
      entityType  ENUM('field','paddock','greenhouse','livestock_shed','water_tank','irrigation_zone','equipment_yard','other') NOT NULL,
      entityId    INT,
      location    JSON,
      description TEXT,
      createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `, "CREATE TABLE iotDigitalTwins");

  // ─── iotCommands ──────────────────────────────────────────────────────────
  await run(connection, `
    CREATE TABLE IF NOT EXISTS iotCommands (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      farmId      INT NOT NULL,
      deviceId    INT NOT NULL,
      issuedBy    INT NOT NULL,
      commandType ENUM('irrigation_on','irrigation_off','valve_open','valve_close','device_restart','sensor_calibrate','request_telemetry','firmware_update','set_reporting_interval') NOT NULL,
      params      JSON,
      status      ENUM('pending','sent','acknowledged','completed','failed') DEFAULT 'pending' NOT NULL,
      result      TEXT,
      sentAt      DATETIME,
      completedAt DATETIME,
      createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `, "CREATE TABLE iotCommands");

  // ─── iotEvents ────────────────────────────────────────────────────────────
  await run(connection, `
    CREATE TABLE IF NOT EXISTS iotEvents (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      farmId    INT NOT NULL,
      deviceId  INT,
      sensorId  INT,
      gatewayId INT,
      eventType VARCHAR(64) NOT NULL,
      source    VARCHAR(64) NOT NULL,
      payload   JSON,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `, "CREATE TABLE iotEvents");

  // ─── iotSensorCalibrationLog ──────────────────────────────────────────────
  await run(connection, `
    CREATE TABLE IF NOT EXISTS iotSensorCalibrationLog (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      sensorId         INT NOT NULL,
      farmId           INT NOT NULL,
      calibratedBy     INT NOT NULL,
      method           VARCHAR(64) NOT NULL,
      offsetBefore     FLOAT,
      multiplierBefore FLOAT,
      offsetAfter      FLOAT NOT NULL,
      multiplierAfter  FLOAT NOT NULL,
      notes            TEXT,
      createdAt        DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `, "CREATE TABLE iotSensorCalibrationLog");

  console.log("\n✅ Phase 5 IoT DB migration complete!");
  process.exit(0);
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
