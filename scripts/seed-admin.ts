import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

async function seedAdmin() {
  console.log("Connecting to TiDB...");
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const email = "admin@sproutxhub.com";
    const rawPassword = "admin@123456";

    // Hash the password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const openId = email;
    const name = "Platform Admin";
    const role = "admin";
    const isEmailVerified = true;

    // Check if user already exists
    const [existing] = await conn.query("SELECT id FROM users WHERE email = ?", [email]) as any;
    if (existing.length > 0) {
      console.log("Admin user already exists. Updating password...");
      await conn.query(
        "UPDATE users SET password = ?, role = 'admin', isEmailVerified = 1 WHERE email = ?",
        [hashedPassword, email]
      );
      console.log("Admin user updated successfully.");
    } else {
      console.log("Admin user not found. Inserting...");
      await conn.query(
        "INSERT INTO users (email, password, name, role, openId, isEmailVerified, loginMethod) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [email, hashedPassword, name, role, openId, isEmailVerified, "local"]
      );
      console.log("Admin user inserted successfully.");
    }

  } catch (e: any) {
    console.error("Error seeding admin:", e.message);
  } finally {
    await conn.end();
  }
}

seedAdmin();
