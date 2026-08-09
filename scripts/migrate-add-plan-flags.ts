import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

async function migrate() {
  console.log("Connecting to TiDB...");
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Add isRecommended column
    await conn.query(`
      ALTER TABLE subscriptionPlans
      ADD COLUMN IF NOT EXISTS isRecommended TINYINT(1) NOT NULL DEFAULT 0
    `);
    console.log("✅ Added isRecommended column");

    // Add isDefaultTrial column
    await conn.query(`
      ALTER TABLE subscriptionPlans
      ADD COLUMN IF NOT EXISTS isDefaultTrial TINYINT(1) NOT NULL DEFAULT 0
    `);
    console.log("✅ Added isDefaultTrial column");

    // Mark Professional as default trial and recommended by default
    await conn.query(`
      UPDATE subscriptionPlans SET isDefaultTrial = 1, isRecommended = 1
      WHERE name = 'Professional' LIMIT 1
    `);
    console.log("✅ Marked Professional as default trial + recommended");

    console.log("\n✨ Migration complete!");
  } catch (e: any) {
    console.error("❌ Migration failed:", e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();
