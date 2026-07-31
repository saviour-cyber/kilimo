import { db } from "./server/db";
import { 
  farms, crops, fields, animals, healthLogs, 
  inventory, equipment, transactions, tasks 
} from "./server/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Starting seed for Dashboard Mockup...");
  
  // Find the first farm or create one
  let allFarms = await db.select().from(farms).limit(1);
  if (allFarms.length === 0) {
    console.log("No farm found. Exiting.");
    process.exit(1);
  }
  
  const farmId = allFarms[0].id;
  console.log("Seeding farm ID:", farmId);

  // 1. Seed Fields & Crops (8 fields, 25 crops)
  for (let i = 1; i <= 8; i++) {
    const [field] = await db.insert(fields).values({
      farmId,
      name: `Field ${String.fromCharCode(64 + i)}`, // Field A, Field B, etc.
      area: (Math.random() * 10 + 1).toString(),
      status: "active"
    }).returning();

    // Insert ~3 crops per field to get to ~25
    for (let j = 0; j < 3; j++) {
      await db.insert(crops).values({
        farmId,
        fieldId: field.id,
        name: j === 0 ? "Maize" : j === 1 ? "Wheat" : "Beans",
        cropType: j === 0 ? "cereal" : j === 1 ? "cereal" : "legume",
        status: "growing",
        plantedDate: new Date(),
        expectedHarvestDate: new Date(Date.now() + 86400000 * 30),
        areaPlanted: (Math.random() * 5).toString()
      });
    }
  }

  // 2. Seed Animals (42 animals)
  for (let i = 1; i <= 42; i++) {
    await db.insert(animals).values({
      farmId,
      name: `Cow #${i}`,
      species: "cattle",
      breed: "Holstein",
      status: i <= 3 ? "sick" : "healthy", // 3 need attention
      dateOfBirth: new Date()
    });
  }

  // 3. Seed Inventory & Equipment (5 low stock items)
  for (let i = 1; i <= 5; i++) {
    await db.insert(inventory).values({
      farmId,
      name: `Fertilizer ${i}`,
      category: "fertilizer",
      quantity: "2",
      unit: "bags",
      minThreshold: "10" // Forces low stock
    });
  }

  // 4. Seed Finance (Income 25000, Expense 18000)
  await db.insert(transactions).values({
    farmId,
    type: "income",
    category: "sales",
    amount: "25000",
    date: new Date(),
    title: "Maize Sales",
    status: "completed"
  });
  await db.insert(transactions).values({
    farmId,
    type: "expense",
    category: "supplies",
    amount: "18000",
    date: new Date(),
    title: "Fertilizer Purchase",
    status: "completed"
  });

  // 5. Seed Tasks (7 pending tasks)
  for (let i = 1; i <= 7; i++) {
    await db.insert(tasks).values({
      farmId,
      title: i === 1 ? "Harvest maize in Field A" : 
             i === 2 ? "Vaccinate 2 cows" : 
             i === 3 ? "Buy more fertilizer" : 
             `Farm Task ${i}`,
      status: "pending",
      priority: i === 1 ? "high" : "medium",
      dueDate: new Date(Date.now() + 86400000 * i)
    });
  }

  console.log("Seed complete! The dashboard will now look exactly like the mockup.");
  process.exit(0);
}

seed().catch(console.error);
