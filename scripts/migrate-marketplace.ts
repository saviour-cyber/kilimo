/**
 * Migration: Add Marketplace Tables
 *
 * Creates:
 *  - marketCategories
 *  - marketListings
 *  - marketListingImages
 *
 * Seeds default categories.
 *
 * Run: npx tsx scripts/migrate-marketplace.ts
 */

import "dotenv/config";
import { getDb } from "../server/db";
import { marketCategories } from "../drizzle/schema";

const DEFAULT_CATEGORIES = [
  { name: "Crops",           slug: "crops",          iconName: "Sprout",      sortOrder: 1 },
  { name: "Livestock",       slug: "livestock",      iconName: "Beef",        sortOrder: 2 },
  { name: "Dairy",           slug: "dairy",          iconName: "Milk",        sortOrder: 3 },
  { name: "Poultry",         slug: "poultry",        iconName: "Bird",        sortOrder: 4 },
  { name: "Fruits",          slug: "fruits",         iconName: "Apple",       sortOrder: 5 },
  { name: "Vegetables",      slug: "vegetables",     iconName: "Carrot",      sortOrder: 6 },
  { name: "Seeds",           slug: "seeds",          iconName: "Leaf",        sortOrder: 7 },
  { name: "Farm Equipment",  slug: "farm-equipment", iconName: "Tractor",     sortOrder: 8 },
  { name: "Farm Inputs",     slug: "farm-inputs",    iconName: "Package",     sortOrder: 9 },
  { name: "Other",           slug: "other",          iconName: "ShoppingBag", sortOrder: 10 },
];

async function migrate() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed.");

  console.log("Creating marketplace tables...");

  // Create marketCategories
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`marketCategories\` (
      \`id\`          INT AUTO_INCREMENT PRIMARY KEY,
      \`name\`        VARCHAR(64) NOT NULL,
      \`slug\`        VARCHAR(64) NOT NULL UNIQUE,
      \`description\` TEXT,
      \`iconName\`    VARCHAR(64),
      \`sortOrder\`   INT NOT NULL DEFAULT 0,
      \`isActive\`    BOOLEAN NOT NULL DEFAULT TRUE,
      \`createdAt\`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ marketCategories table created.");

  // Create marketListings
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`marketListings\` (
      \`id\`             INT AUTO_INCREMENT PRIMARY KEY,
      \`organizationId\` INT NOT NULL,
      \`farmId\`         INT,
      \`sellerUserId\`   INT NOT NULL,
      \`categoryId\`     INT,
      \`title\`          VARCHAR(128) NOT NULL,
      \`description\`    TEXT,
      \`price\`          DECIMAL(10,2) NOT NULL,
      \`currency\`       VARCHAR(8) NOT NULL DEFAULT 'KES',
      \`quantity\`       DECIMAL(10,2),
      \`unit\`           VARCHAR(32),
      \`county\`         VARCHAR(64),
      \`location\`       VARCHAR(256),
      \`status\`         ENUM('draft','active','paused','sold','archived') NOT NULL DEFAULT 'draft',
      \`publishedAt\`    TIMESTAMP NULL,
      \`createdAt\`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_org (\`organizationId\`),
      INDEX idx_farm (\`farmId\`),
      INDEX idx_status (\`status\`),
      INDEX idx_category (\`categoryId\`),
      INDEX idx_county (\`county\`)
    )
  `);
  console.log("✅ marketListings table created.");

  // Create marketListingImages
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`marketListingImages\` (
      \`id\`         INT AUTO_INCREMENT PRIMARY KEY,
      \`listingId\`  INT NOT NULL,
      \`storageKey\` VARCHAR(512) NOT NULL,
      \`url\`        TEXT NOT NULL,
      \`sortOrder\`  INT NOT NULL DEFAULT 0,
      \`isPrimary\`  BOOLEAN NOT NULL DEFAULT FALSE,
      \`createdAt\`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_listing (\`listingId\`)
    )
  `);
  console.log("✅ marketListingImages table created.");

  // Seed default categories (skip if already exist)
  console.log("Seeding default categories...");
  for (const cat of DEFAULT_CATEGORIES) {
    try {
      await db.insert(marketCategories).values(cat);
      console.log(`  ✅ Inserted category: ${cat.name}`);
    } catch (e: any) {
      if (e.code === "ER_DUP_ENTRY") {
        console.log(`  ⏭️  Skipped (already exists): ${cat.name}`);
      } else {
        throw e;
      }
    }
  }

  console.log("\n✅ Marketplace migration complete.");
  process.exit(0);
}

migrate().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});
