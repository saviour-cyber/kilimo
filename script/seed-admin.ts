/**
 * seed-admin.ts
 * Creates (or resets) the platform superadmin account.
 *
 * Run with:  npx tsx script/seed-admin.ts
 *
 * Env vars required:
 *   DATABASE_URL  – MySQL connection string
 *   ADMIN_EMAIL   – Desired admin email  (default: admin@kilimohub.com)
 *   ADMIN_PASSWORD – Plain-text password  (default: Admin@123456)
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? "admin@kilimohub.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@123456";
const ADMIN_NAME     = "Platform Superadmin";

async function main() {
  console.log("🔑 Seeding platform admin account…");

  const connection = await mysql.createConnection({ 
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // Check if the admin already exists
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT id, email, role FROM users WHERE email = ? LIMIT 1",
      [ADMIN_EMAIL]
    );

    if (rows.length > 0) {
      // Update the existing user to ensure role = admin, but DO NOT overwrite password
      await connection.execute(
        "UPDATE users SET role = 'admin', name = ? WHERE email = ?",
        [ADMIN_NAME, ADMIN_EMAIL]
      );
      console.log(`✅  Admin account already exists — confirmed role=admin`);
      console.log(`    ID: ${rows[0].id}  |  Email: ${ADMIN_EMAIL}`);
    } else {
      // Create a brand-new admin user
      const [result] = await connection.execute<mysql.ResultSetHeader>(
        `INSERT INTO users (name, email, password, role, loginMethod, createdAt, updatedAt, lastSignedIn)
         VALUES (?, ?, ?, 'admin', 'local', NOW(), NOW(), NOW())`,
        [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
      );
      console.log(`✅  Admin account created — ID: ${result.insertId}  |  Email: ${ADMIN_EMAIL}`);
    }

    console.log("\n🚀 Admin Login Credentials");
    console.log("   URL:      /login  (then navigate to /admin)");
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log("\n💡 Change the password via ADMIN_EMAIL and ADMIN_PASSWORD env vars or by logging in.");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
