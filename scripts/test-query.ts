import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

try {
  const [rows] = await conn.query("select `id`, `openId`, `password`, `name`, `email`, `isEmailVerified`, `phone`, `country`, `loginMethod`, `role`, `avatarUrl`, `preferredLanguage`, `theme`, `timezone`, `createdAt`, `updatedAt`, `lastSignedIn` from `users` where `users`.`email` = 'admin@sproutxhub.com' limit 1");
  console.log("Query SUCCESS:");
  console.log(rows);
} catch (e: any) {
  console.log("Query FAILED:");
  console.error(e.message);
} finally {
  await conn.end();
}
