import mysql from 'mysql2/promise';
import 'dotenv/config';
import fs from 'fs/promises';

async function check() {
  let url = process.env.DATABASE_URL;
  if (!url.includes('ssl=')) {
    url += (url.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":true}';
  }
  const connection = await mysql.createConnection(url);
  try {
    const [rows] = await connection.query("SHOW TABLES LIKE 'workers'");
    console.log("Workers table exists:", rows.length > 0);
    
    if (rows.length === 0) {
      const sql = await fs.readFile('drizzle/0004_fluffy_nighthawk.sql', 'utf8');
      const statements = sql.split('--> statement-breakpoint');
      for (const stmt of statements) {
        if (stmt.trim()) {
          console.log("Executing...", stmt.trim().substring(0, 50));
          try {
             await connection.query(stmt);
          } catch(e) {
             console.log("Error on statement (might already exist):", e.message);
          }
        }
      }
      console.log("Migration applied!");
    }
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
check();