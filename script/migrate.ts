/**
 * migrate.ts
 * Raw SQL migration runner — creates all required tables if they don't exist.
 * Uses mysql2 directly to avoid drizzle-kit interactive prompt / hang issues.
 *
 * Run with:  npx tsx script/migrate.ts
 */

import "dotenv/config";
import mysql from "mysql2/promise";

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

async function run() {
  console.log("🔄  Running raw SQL migrations…");

  const conn = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: SSL_REQUIRED ? { rejectUnauthorized: false } : undefined,
    multipleStatements: false,
  });

  const statements: Array<{ name: string; sql: string }> = [
    {
      name: "activitylogs",
      sql: `
        CREATE TABLE IF NOT EXISTS \`activitylogs\` (
          \`id\`          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
          \`farmId\`      INT          NOT NULL DEFAULT 0,
          \`userId\`      INT          NOT NULL,
          \`action\`      VARCHAR(128) NOT NULL,
          \`entityType\`  VARCHAR(64)  NULL,
          \`entityId\`    INT          NULL,
          \`description\` TEXT         NULL,
          \`metadata\`    JSON         NULL,
          \`createdAt\`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `,
    },
    {
      name: "platformannouncements",
      sql: `
        CREATE TABLE IF NOT EXISTS \`platformannouncements\` (
          \`id\`        VARCHAR(64)  NOT NULL PRIMARY KEY,
          \`title\`     TEXT         NOT NULL,
          \`content\`   TEXT         NOT NULL,
          \`type\`      VARCHAR(32)  NOT NULL DEFAULT 'info',
          \`isActive\`  TINYINT(1)   NOT NULL DEFAULT 1,
          \`createdAt\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `,
    },
    {
      name: "platformannouncements-alter-id",
      sql: `ALTER TABLE \`platformannouncements\` MODIFY COLUMN \`id\` VARCHAR(64) NOT NULL;`,
    },
  ];

  for (const { name, sql } of statements) {
    try {
      await conn.execute(sql);
      console.log(`  ✅  Table \`${name}\` is ready`);
    } catch (err: any) {
      console.error(`  ❌  Failed on \`${name}\`: ${err.message}`);
    }
  }

  conn.destroy();
  console.log("✅  Migration complete");
}

run().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
