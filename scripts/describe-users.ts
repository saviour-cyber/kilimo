import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

try {
  const [rows] = await conn.query("DESCRIBE users");
  console.log("DESCRIBE users:");
  console.log(rows);
} catch (e) {
  console.error(e);
} finally {
  await conn.end();
}
