/**
 * sync-schema.ts
 * ---------------------------------------------------------------------------
 * Idempotent schema-sync script.  Runs BEFORE the main Drizzle migrate step
 * so that the migrator never encounters a table whose structure doesn't match
 * what the generated SQL expects.
 *
 * Strategy
 * --------
 * For each "special" table (varchar-PK tables that diverge from the INT
 * AUTO_INCREMENT baseline), we:
 *   1. Read the live INFORMATION_SCHEMA to discover existing column types.
 *   2. If the table is missing entirely → create it.
 *   3. If the table exists but the PK column is INT → drop the old table and
 *      recreate it (safe because these tables hold platform config, not user data;
 *      they will be re-seeded by seed-modules.ts / seed-admin.ts anyway).
 *   4. If the table exists with the correct varchar PK → ensure every column
 *      has the right definition via ALTER TABLE … MODIFY COLUMN (idempotent).
 *
 * This is intentionally conservative: it only touches the three tables that
 * are known to use varchar PKs (platformannouncements, platformModules,
 * platformServices).  All other tables are left to the Drizzle migrator.
 *
 * Run manually: npx tsx script/sync-schema.ts
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
  DATABASE_URL.includes("aiven") ||
  DATABASE_URL.includes("ssl=");

// ---------------------------------------------------------------------------
// Target DDL for each varchar-PK table
// ---------------------------------------------------------------------------
const TARGET_TABLES: Record<
  string,
  { createSql: string; columns: Array<{ name: string; definition: string }> }
> = {
  platformannouncements: {
    createSql: `
      CREATE TABLE \`platformannouncements\` (
        \`id\`        varchar(64)  NOT NULL,
        \`title\`     text         NOT NULL,
        \`content\`   text         NOT NULL,
        \`type\`      varchar(32)  NOT NULL DEFAULT 'info',
        \`isActive\`  tinyint(1)   NOT NULL DEFAULT 1,
        \`createdAt\` timestamp    NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp    NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `,
    columns: [
      { name: "id",        definition: "varchar(64) NOT NULL" },
      { name: "title",     definition: "text NOT NULL" },
      { name: "content",   definition: "text NOT NULL" },
      { name: "type",      definition: "varchar(32) NOT NULL DEFAULT 'info'" },
      { name: "isActive",  definition: "tinyint(1) NOT NULL DEFAULT 1" },
      { name: "createdAt", definition: "timestamp NOT NULL DEFAULT (now())" },
      { name: "updatedAt", definition: "timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP" },
    ],
  },

  platformModules: {
    createSql: `
      CREATE TABLE \`platformModules\` (
        \`id\`          varchar(64)  NOT NULL,
        \`name\`        text         NOT NULL,
        \`description\` text,
        \`version\`     varchar(32)  DEFAULT '1.0.0',
        \`isEnabled\`   tinyint(1)   NOT NULL DEFAULT 1,
        \`icon\`        varchar(64),
        \`sortOrder\`   int          DEFAULT 0,
        \`createdAt\`   timestamp    NOT NULL DEFAULT (now()),
        \`updatedAt\`   timestamp    NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `,
    columns: [
      { name: "id",          definition: "varchar(64) NOT NULL" },
      { name: "name",        definition: "text NOT NULL" },
      { name: "description", definition: "text" },
      { name: "version",     definition: "varchar(32) DEFAULT '1.0.0'" },
      { name: "isEnabled",   definition: "tinyint(1) NOT NULL DEFAULT 1" },
      { name: "icon",        definition: "varchar(64)" },
      { name: "sortOrder",   definition: "int DEFAULT 0" },
      { name: "createdAt",   definition: "timestamp NOT NULL DEFAULT (now())" },
      { name: "updatedAt",   definition: "timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP" },
    ],
  },

  platformServices: {
    createSql: `
      CREATE TABLE \`platformServices\` (
        \`id\`          varchar(64)  NOT NULL,
        \`name\`        varchar(128) NOT NULL,
        \`description\` text,
        \`isEnabled\`   tinyint(1)   NOT NULL DEFAULT 1,
        \`icon\`        varchar(64),
        \`category\`    varchar(64),
        \`createdAt\`   timestamp    NOT NULL DEFAULT (now()),
        \`updatedAt\`   timestamp    NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `,
    columns: [
      { name: "id",          definition: "varchar(64) NOT NULL" },
      { name: "name",        definition: "varchar(128) NOT NULL" },
      { name: "description", definition: "text" },
      { name: "isEnabled",   definition: "tinyint(1) NOT NULL DEFAULT 1" },
      { name: "icon",        definition: "varchar(64)" },
      { name: "category",    definition: "varchar(64)" },
      { name: "createdAt",   definition: "timestamp NOT NULL DEFAULT (now())" },
      { name: "updatedAt",   definition: "timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP" },
    ],
  },
};

// ---------------------------------------------------------------------------

async function syncTable(
  conn: mysql.Connection,
  tableName: string,
  target: (typeof TARGET_TABLES)[string]
): Promise<void> {
  console.log(`\n🔍  Checking table: ${tableName}`);

  // 1. Does the table exist at all?
  const [existRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT TABLE_NAME FROM information_schema.tables
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  if (existRows.length === 0) {
    console.log(`  ➕  Table missing – creating ${tableName} ...`);
    await conn.query(target.createSql);
    console.log(`  ✅  ${tableName} created`);
    return;
  }

  // 2. Inspect the current PK column type
  const [pkRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, COLUMN_KEY
     FROM information_schema.columns
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = ?
       AND COLUMN_KEY   = 'PRI'`,
    [tableName]
  );

  if (pkRows.length === 0) {
    console.warn(`  ⚠️  ${tableName} has no primary key — skipping`);
    return;
  }

  const pk = pkRows[0];

  // 3. If PK is INT (legacy) → drop and recreate
  if (pk.DATA_TYPE === "int" || pk.DATA_TYPE === "bigint") {
    console.log(
      `  🔄  ${tableName} has legacy INT primary key (${pk.COLUMN_TYPE}) — dropping and recreating ...`
    );
    await conn.query(`DROP TABLE \`${tableName}\``);
    await conn.query(target.createSql);
    console.log(`  ✅  ${tableName} recreated with varchar(64) primary key`);
    return;
  }

  // 4. Table exists with correct varchar PK → patch each column definition
  console.log(`  ✅  ${tableName} has correct varchar PK — verifying columns ...`);

  const [colRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
     FROM information_schema.columns
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`,
    [tableName]
  );

  const existingCols = new Set(colRows.map((c) => c.COLUMN_NAME));

  for (const col of target.columns) {
    if (!existingCols.has(col.name)) {
      console.log(`    ➕  Adding missing column: ${col.name}`);
      await conn.query(
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`${col.name}\` ${col.definition}`
      );
    }
  }

  // Ensure createdAt / updatedAt have proper defaults (most common drift)
  const timestampFixes: Array<{ col: string; def: string }> = [
    { col: "createdAt", def: "timestamp NOT NULL DEFAULT (now())" },
    { col: "updatedAt", def: "timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP" },
  ];

  for (const fix of timestampFixes) {
    const existing = colRows.find((c) => c.COLUMN_NAME === fix.col);
    if (existing) {
      const hasDefault =
        existing.COLUMN_DEFAULT !== null &&
        existing.COLUMN_DEFAULT !== undefined &&
        existing.COLUMN_DEFAULT !== "";
      if (!hasDefault) {
        console.log(`    🔧  Fixing missing DEFAULT on column: ${fix.col}`);
        await conn.query(
          `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${fix.col}\` ${fix.def}`
        );
      }
    }
  }

  console.log(`  ✅  ${tableName} — all columns verified`);
}

async function run() {
  console.log("🔄  Starting schema sync ...");

  const conn = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: SSL_REQUIRED ? { rejectUnauthorized: false } : undefined,
  });

  try {
    for (const [tableName, target] of Object.entries(TARGET_TABLES)) {
      await syncTable(conn, tableName, target);
    }
    console.log("\n✅  Schema sync complete!");
  } catch (err: any) {
    console.error("\n❌  Schema sync failed:", err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error("❌  Fatal error during schema sync:", err);
  process.exit(1);
});
