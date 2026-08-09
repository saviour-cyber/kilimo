import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const [rows] = await conn.query("SHOW TABLES") as any;
const tables: string[] = rows.map((r: any) => Object.values(r)[0] as string);

console.log(`\nFound ${tables.length} tables:\n`);
tables.forEach(t => console.log(" -", t));

await conn.end();
