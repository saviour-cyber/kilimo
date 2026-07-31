import "dotenv/config";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Migrating reports tables...");
  const db = await getDb();
  if (!db) {
    console.error("No DB connection");
    process.exit(1);
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS generatedReports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmId INT NOT NULL,
      name VARCHAR(256) NOT NULL,
      moduleKeys JSON NOT NULL,
      filters JSON,
      format ENUM('pdf', 'excel', 'csv', 'print') NOT NULL,
      fileUrl TEXT,
      generatedByUserId INT NOT NULL,
      generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      status ENUM('pending', 'completed', 'failed') DEFAULT 'pending' NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS scheduledReports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmId INT NOT NULL,
      name VARCHAR(256) NOT NULL,
      moduleKeys JSON NOT NULL,
      filters JSON,
      format ENUM('pdf', 'excel', 'csv') NOT NULL,
      frequency ENUM('daily', 'weekly', 'monthly') NOT NULL,
      nextRunAt TIMESTAMP NOT NULL,
      lastRunAt TIMESTAMP,
      createdByUserId INT NOT NULL,
      isActive TINYINT(1) DEFAULT 1 NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `);

  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
