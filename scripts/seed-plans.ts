/**
 * Seed default subscription plans.
 * Run with: npx tsx scripts/seed-plans.ts
 *
 * This creates the three core KilimoHub plans:
 *  - Starter (free / trial only)
 *  - Professional
 *  - Enterprise
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { subscriptionPlans, subscriptionPlanFeatures } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const PLANS = [
  {
    name: "Starter",
    description: "Perfect for small farms getting started. Includes core modules to manage your farm.",
    monthlyPrice: "0",
    yearlyPrice: "0",
    currency: "KES",
    trialDays: 14,
    maxFarms: 1,
    maxUsers: 5,
    maxDevices: 0,
    maxStorageMb: 500,
    isActive: true,
    sortOrder: 0,
    features: [
      { featureKey: "dashboard", featureType: "module" as const },
      { featureKey: "crop", featureType: "module" as const },
      { featureKey: "tasks", featureType: "module" as const },
    ],
  },
  {
    name: "Professional",
    description: "For growing farms that need advanced management, livestock, finance, and reports.",
    monthlyPrice: "2999",
    yearlyPrice: "29990",
    currency: "KES",
    trialDays: 14,
    maxFarms: 5,
    maxUsers: 20,
    maxDevices: 10,
    maxStorageMb: 5120,
    isActive: true,
    sortOrder: 1,
    features: [
      { featureKey: "dashboard", featureType: "module" as const },
      { featureKey: "crop", featureType: "module" as const },
      { featureKey: "livestock", featureType: "module" as const },
      { featureKey: "inventory", featureType: "module" as const },
      { featureKey: "finance", featureType: "module" as const },
      { featureKey: "tasks", featureType: "module" as const },
      { featureKey: "disease", featureType: "module" as const },
      { featureKey: "reports", featureType: "module" as const },
    ],
  },
  {
    name: "Enterprise",
    description: "Full platform access with IoT, AI Intelligence, weather monitoring, and unlimited scale.",
    monthlyPrice: "9999",
    yearlyPrice: "99990",
    currency: "KES",
    trialDays: 30,
    maxFarms: null,
    maxUsers: null,
    maxDevices: null,
    maxStorageMb: null,
    isActive: true,
    sortOrder: 2,
    features: [
      { featureKey: "dashboard", featureType: "module" as const },
      { featureKey: "crop", featureType: "module" as const },
      { featureKey: "livestock", featureType: "module" as const },
      { featureKey: "inventory", featureType: "module" as const },
      { featureKey: "finance", featureType: "module" as const },
      { featureKey: "tasks", featureType: "module" as const },
      { featureKey: "disease", featureType: "module" as const },
      { featureKey: "reports", featureType: "module" as const },
      { featureKey: "iot", featureType: "module" as const },
      { featureKey: "weather", featureType: "service" as const },
      { featureKey: "intelligence", featureType: "service" as const },
      { featureKey: "ai_assistant", featureType: "service" as const },
    ],
  },
];

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log("🌱 Seeding subscription plans...\n");

  for (const plan of PLANS) {
    const { features, ...planData } = plan;

    // Check if plan already exists
    const [existing] = await db
      .select({ id: subscriptionPlans.id })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, planData.name));

    if (existing) {
      console.log(`  ⏩ Plan "${planData.name}" already exists (id=${existing.id}), skipping.`);
      continue;
    }

    const [result] = await db.insert(subscriptionPlans).values(planData);
    const planId = result.insertId;

    await db.insert(subscriptionPlanFeatures).values(
      features.map((f) => ({ planId, ...f }))
    );

    console.log(`  ✅ Created plan "${planData.name}" (id=${planId}) with ${features.length} features.`);
  }

  console.log("\n✨ Done!");
  await connection.end();
}

main().catch((err) => {
  console.error("❌ Error seeding plans:", err);
  process.exit(1);
});
