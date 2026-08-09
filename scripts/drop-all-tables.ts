import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const url = process.env.DATABASE_URL!;

const conn = await mysql.createConnection({
  uri: url,
  ssl: { rejectUnauthorized: false },
});

// Disable foreign key checks so we can drop in any order
await conn.query("SET FOREIGN_KEY_CHECKS = 0");

const [rows] = await conn.query("SHOW TABLES") as any;
const tables: string[] = rows.map((r: any) => Object.values(r)[0] as string);

console.log(`Found ${tables.length} tables:`);
console.log(tables.join(", "));

if (tables.length > 0) {
  const dropSql = `DROP TABLE IF EXISTS ${tables.map(t => `\`${t}\``).join(", ")}`;
  console.log("\nDropping all tables...");
  await conn.query(dropSql);
  console.log("✓ All tables dropped.");
} else {
  console.log("No tables to drop.");
}

await conn.query("SET FOREIGN_KEY_CHECKS = 1");
await conn.end();
console.log("Done.");
