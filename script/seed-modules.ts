import "dotenv/config";
import mysql from "mysql2/promise";

async function run() {
  console.log("🔧 Creating platform tables and seeding...");

  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
  });

  try {
    // Create tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`platformModules\` (
        \`id\` varchar(64) NOT NULL,
        \`name\` text NOT NULL,
        \`description\` text,
        \`version\` varchar(32) DEFAULT '1.0.0',
        \`isEnabled\` tinyint(1) NOT NULL DEFAULT 1,
        \`icon\` varchar(64),
        \`sortOrder\` int NOT NULL DEFAULT 0,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ platformModules table ready");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`platformServices\` (
        \`id\` varchar(64) NOT NULL,
        \`name\` text NOT NULL,
        \`description\` text,
        \`isEnabled\` tinyint(1) NOT NULL DEFAULT 1,
        \`providerConfig\` json,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ platformServices table ready");

    // Seed modules
    const modules = [
      ["crops", "Crops", "Manage fields, plantings, and harvests", "Leaf", 1],
      ["livestock", "Livestock", "Manage animals, breeding, and health", "PiggyBank", 2],
      ["finance", "Finance", "Track budgets, transactions, and P&L", "CircleDollarSign", 3],
      ["inventory", "Inventory", "Manage stock, equipment, and suppliers", "Package", 4],
      ["disease", "Disease Detection", "AI-powered crop and animal disease scanning", "Microscope", 5],
      ["marketplace", "Marketplace", "Buy and sell farm produce and equipment", "Store", 6],
      ["aquaculture", "Aquaculture", "Manage fish ponds and aquatic life", "Waves", 7],
      ["poultry", "Poultry", "Specialized poultry and egg management", "Bird", 8],
      ["dairy", "Dairy", "Milk production and herd tracking", "Milk", 9],
      ["beekeeping", "Beekeeping", "Apiary and honey harvest management", "Hexagon", 10],
      ["fisheries", "Fisheries", "Wild catch and fishery operations", "Fish", 11],
    ];

    for (const [id, name, description, icon, order] of modules) {
      await connection.execute(
        `INSERT INTO \`platformModules\` (id, name, description, icon, sortOrder, isEnabled)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon), sortOrder=VALUES(sortOrder)`,
        [id, name, description, icon, order]
      );
      console.log(`  ✅ Module: ${name}`);
    }

    // Seed services
    const services = [
      ["weather", "Weather Insights", "Hyper-local weather forecasting for farms"],
      ["reports", "Reports Hub", "Generate comprehensive PDF and CSV reports"],
      ["notifications", "Notifications", "System and alert notifications"],
      ["kili-ai", "Kili AI", "AI farming assistant powered by GenAI"],
      ["iot-engine", "IoT Engine", "Manage connected sensors and gateways"],
      ["maps", "GIS Maps", "Geospatial mapping and satellite imagery"],
      ["calendar", "Calendar", "Farm task scheduling and events"],
      ["developer-api", "Developer API", "REST and GraphQL API access for integration"],
    ];

    for (const [id, name, description] of services) {
      await connection.execute(
        `INSERT INTO \`platformServices\` (id, name, description, isEnabled)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)`,
        [id, name, description]
      );
      console.log(`  ✅ Service: ${name}`);
    }

    console.log("\n🎉 Done! All platform modules and services seeded.");
  } catch (err) {
    console.error("❌ Error:", err);
    throw err;
  } finally {
    await connection.end();
  }
}

run();
