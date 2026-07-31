import "dotenv/config";
import mysql from "mysql2/promise";
import { ENV } from "../server/_core/env";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const connection = await mysql.createConnection(url);

  console.log("Connected to database. Running Phase 4 IoT migrations...");

  try {
    console.log("1. Adding webhookUrl to iotAlertRules...");
    await connection.execute(`
      ALTER TABLE iotAlertRules 
      ADD COLUMN webhookUrl VARCHAR(512);
    `);
    console.log("✅ Added webhookUrl to iotAlertRules");
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("⏭️ webhookUrl column already exists");
    } else {
      throw e;
    }
  }

  try {
    console.log("2. Adding ruleId to iotAlerts...");
    await connection.execute(`
      ALTER TABLE iotAlerts 
      ADD COLUMN ruleId INT;
    `);
    console.log("✅ Added ruleId to iotAlerts");
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("⏭️ ruleId column already exists");
    } else {
      throw e;
    }
  }

  console.log("✅ Phase 4 IoT DB migration complete!");
  process.exit(0);
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
