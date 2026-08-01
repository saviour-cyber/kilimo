/**
 * migrate.ts
 * Executes Drizzle migrations programmatically against the database.
 * This runs automatically during the Render build process (see render.yaml).
 * 
 * Run manually with:  npx tsx script/migrate.ts
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set");
  process.exit(1);
}

const SSL_REQUIRED =
  DATABASE_URL.includes("tidb") ||
  DATABASE_URL.includes("planetscale") ||
  DATABASE_URL.includes("amazonaws") ||
  DATABASE_URL.includes("ssl=");

async function runMigrations() {
  console.log("🔄  Connecting to database to run migrations...");

  // 1. Create a MySQL connection
  const conn = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: SSL_REQUIRED ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true, // required by Drizzle migrator
  });

  // 2. Initialize Drizzle ORM
  const db = drizzle(conn);

  try {
    console.log("🔄  Applying Drizzle migrations from ./drizzle folder...");
    
    // 3. Run the migrations
    // Drizzle will automatically check the __drizzle_migrations table
    // and only apply SQL files that haven't been run yet.
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "./drizzle") });
    
    console.log("✅  Migrations applied successfully!");
  } catch (err: any) {
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
  } finally {
    // 4. Clean up connection
    await conn.end();
  }
}

runMigrations().catch((err) => {
  console.error("❌  Fatal error during migration:", err);
  process.exit(1);
});
