// ─── Seed Admin Script ────────────────────────────────────────────────────────
// Creates (or updates) the platform super-admin account directly in the DB.
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env.
//
// Usage:  npx tsx scripts/seed-admin.ts
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@kilimohub.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD environment variable is required.");
    console.error("   Set it in your .env file and re-run this script.");
    process.exit(1);
  }

  const adminName = process.env.ADMIN_NAME ?? "Platform Admin";

  const pool = mysql.createPool({
    uri: url,
    connectionLimit: 1,
    ssl: url.includes("tidb") || url.includes("ssl=")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    // Check if admin already exists
    const [rows] = await pool.execute(
      "SELECT id, role FROM users WHERE email = ?",
      [adminEmail]
    ) as any;

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (rows.length > 0) {
      // Update existing account to ensure admin role + new password
      await pool.execute(
        "UPDATE users SET password = ?, role = 'admin', isEmailVerified = 1, name = ? WHERE email = ?",
        [hashedPassword, adminName, adminEmail]
      );
      console.log(`✅ Admin account updated: ${adminEmail}`);
    } else {
      // Insert new admin account
      await pool.execute(
        `INSERT INTO users (email, name, password, role, isEmailVerified, loginMethod, openId)
         VALUES (?, ?, ?, 'admin', 1, 'local', ?)`,
        [adminEmail, adminName, hashedPassword, adminEmail]
      );
      console.log(`✅ Admin account created: ${adminEmail}`);
    }

    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: (as set in ADMIN_PASSWORD)`);
    console.log(`   Login at: /admin/login`);
  } catch (err) {
    console.error("❌ Failed to seed admin:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
