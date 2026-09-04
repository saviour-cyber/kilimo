import { createConnection } from "mysql2/promise";

async function run() {
  const url = 'mysql://mXwhsj2N22MXiEk.root:UUlGcnm0HW7ZKe2x@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/kilimohub';
  const c = await createConnection({ uri: url, ssl: { rejectUnauthorized: true }});
  try {
    await c.execute("ALTER TABLE marketListings ADD COLUMN contactPhone varchar(32) NULL");
    console.log("✓ contactPhone column added to marketListings");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("✓ contactPhone column already exists — skipping");
    } else {
      console.error("Error:", e.message);
    }
  }
  await c.end();
  process.exit(0);
}

run();
