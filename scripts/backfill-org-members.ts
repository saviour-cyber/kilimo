/**
 * One-shot backfill: ensure every organization owner has an organizationMembers row.
 *
 * Run with: npx tsx scripts/backfill-org-members.ts
 *
 * This is safe to run multiple times — it skips orgs where the owner already
 * has a membership row.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { organizations, organizationMembers } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(connection);

  console.log("🔍 Scanning organizations for missing owner memberships...\n");

  const allOrgs = await db.select({ id: organizations.id, ownerId: organizations.ownerId }).from(organizations);

  let fixed = 0;
  let skipped = 0;

  for (const org of allOrgs) {
    // Check if owner already has a membership row
    const [existing] = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, org.id),
          eq(organizationMembers.userId, org.ownerId)
        )
      )
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    // Insert the owner as a member
    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: org.ownerId,
      role: "owner",
      isActive: true,
    });

    console.log(`  ✅ Added owner membership: orgId=${org.id}, userId=${org.ownerId}`);
    fixed++;
  }

  console.log(`\n✨ Done! Fixed=${fixed}, Skipped (already had row)=${skipped}`);
  await connection.end();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
