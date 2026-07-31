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
  console.log("Connected. Running Settings DB migration...\n");

  // ─── Extend users ─────────────────────────────────────────────────────────
  await run(connection, `ALTER TABLE users ADD COLUMN preferredLanguage VARCHAR(16) DEFAULT 'en'`, "users.preferredLanguage");
  await run(connection, `ALTER TABLE users ADD COLUMN theme ENUM('light','dark','system') DEFAULT 'system'`, "users.theme");

  // ─── Extend organizations ─────────────────────────────────────────────────
  await run(connection, `ALTER TABLE organizations ADD COLUMN logoUrl TEXT`, "organizations.logoUrl");
  await run(connection, `ALTER TABLE organizations ADD COLUMN description TEXT`, "organizations.description");
  await run(connection, `ALTER TABLE organizations ADD COLUMN address TEXT`, "organizations.address");
  await run(connection, `ALTER TABLE organizations ADD COLUMN taxId VARCHAR(64)`, "organizations.taxId");
  await run(connection, `ALTER TABLE organizations ADD COLUMN contactEmail VARCHAR(320)`, "organizations.contactEmail");
  await run(connection, `ALTER TABLE organizations ADD COLUMN contactPhone VARCHAR(32)`, "organizations.contactPhone");

  console.log("\n✅ Settings DB migration complete!");
  process.exit(0);
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
