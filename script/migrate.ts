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
import fs from "fs";
import crypto from "crypto";

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
    
    // --- Auto-Baseline Logic ---
    // If the animals table exists but __drizzle_migrations is empty, baseline it
    const [tables] = await conn.query("SHOW TABLES LIKE 'animals'");
    if (Array.isArray(tables) && tables.length > 0) {
      // The database is already populated.
      // We must ensure the initial migration is marked as applied using the EXACT hash from this environment
      
      const migrationFile = path.resolve(process.cwd(), "./drizzle/0000_high_johnny_storm.sql");
      if (fs.existsSync(migrationFile)) {
        const sqlContent = fs.readFileSync(migrationFile, 'utf8');
        const fileHash = crypto.createHash('sha256').update(sqlContent).digest('hex');
        
        // Ensure __drizzle_migrations exists
        await conn.query(`
          CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
          )
        `);
        
        // Check if baseline exists
        const [rows] = await conn.query("SELECT * FROM \`__drizzle_migrations\`");
        if (!Array.isArray(rows) || rows.length === 0) {
          console.log(`📌 Baselining existing database with hash: ${fileHash}`);
          await conn.execute("INSERT INTO \`__drizzle_migrations\` (hash, created_at) VALUES (?, ?)", [fileHash, Date.now()]);
        } else {
          // It exists, let's make sure our exact environment hash is in there
          const hashes = rows.map((r: any) => r.hash);
          if (!hashes.includes(fileHash)) {
             console.log(`📌 Injecting environment-specific hash into baseline: ${fileHash}`);
             await conn.execute("INSERT INTO \`__drizzle_migrations\` (hash, created_at) VALUES (?, ?)", [fileHash, Date.now()]);
          }
        }
      }
    }
    // ---------------------------

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
