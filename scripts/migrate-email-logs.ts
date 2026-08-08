// One-shot migration script — creates platformEmailLogs table only
import "dotenv/config";
import mysql from "mysql2/promise";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const pool = mysql.createPool({
    uri: url,
    connectionLimit: 1,
    ssl: url.includes("tidb") || url.includes("ssl=")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS \`platformEmailLogs\` (
      \`id\`                int AUTO_INCREMENT NOT NULL,
      \`senderId\`          int,
      \`recipient\`         varchar(320) NOT NULL,
      \`subject\`           varchar(256) NOT NULL,
      \`templateKey\`       varchar(64) NOT NULL,
      \`status\`            enum('queued','sent','delivered','failed') NOT NULL DEFAULT 'queued',
      \`providerMessageId\` varchar(128),
      \`errorMessage\`      text,
      \`sentAt\`            timestamp NOT NULL DEFAULT (now()),
      \`deliveredAt\`       timestamp,
      \`failedAt\`          timestamp,
      CONSTRAINT \`platformEmailLogs_id\` PRIMARY KEY(\`id\`)
    );
  `;

  try {
    const [result] = await pool.execute(sql);
    console.log("✅ platformEmailLogs table created (or already exists).", result);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
