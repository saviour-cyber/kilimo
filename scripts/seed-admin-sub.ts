import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

async function grantAdminSub() {
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const email = "admin@sproutxhub.com";
    
    // 1. Get user id
    const [users] = await conn.query("SELECT id FROM users WHERE email = ?", [email]) as any;
    if (users.length === 0) {
      console.log("Admin user not found.");
      return;
    }
    const userId = users[0].id;

    // 2. Get organization
    const [orgs] = await conn.query("SELECT id FROM organizations WHERE ownerId = ? LIMIT 1", [userId]) as any;
    if (orgs.length === 0) {
      console.log("Admin user has no organization yet. Please log in and create a farm/org first.");
      return;
    }
    const orgId = orgs[0].id;

    // 3. Get Enterprise Plan
    const [plans] = await conn.query("SELECT id FROM subscriptionPlans WHERE name = 'Enterprise' LIMIT 1") as any;
    if (plans.length === 0) {
      console.log("Enterprise plan not found. Please run seed-plans.ts first.");
      return;
    }
    const planId = plans[0].id;

    // 4. Upsert subscription
    await conn.query(`
      INSERT INTO subscriptions (organizationId, planId, status, billingInterval, currentPeriodStart, currentPeriodEnd)
      VALUES (?, ?, 'active', 'monthly', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
      ON DUPLICATE KEY UPDATE planId = ?, status = 'active'
    `, [orgId, planId, planId]);

    console.log("✅ Successfully granted Enterprise Subscription to admin's organization!");

  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    await conn.end();
  }
}

grantAdminSub();
