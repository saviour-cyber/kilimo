/**
 * sync-local-to-tidb.ts
 * Copies the entire local MySQL database to TiDB cloud.
 * DESTRUCTIVE: Drops and recreates all tables in TiDB.
 */
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const LOCAL_URL = 'mysql://root:eldavis45@localhost:3306/KiliSensehub';
const CLOUD_URL = process.env.DATABASE_URL!;

async function run() {
  console.log('🔌 Connecting to local MySQL...');
  const local = await mysql.createConnection(LOCAL_URL);

  console.log('🔌 Connecting to TiDB cloud...');
  const cloud = await mysql.createConnection({ uri: CLOUD_URL, ssl: { rejectUnauthorized: false } });

  // Get all tables from local DB
  const [tables] = await local.query<any[]>('SHOW TABLES');
  const tableNames: string[] = tables.map((r: any) => Object.values(r)[0] as string);
  console.log(`\n📋 Found ${tableNames.length} tables:`, tableNames.join(', '), '\n');

  // Disable FK checks on cloud for clean import
  await cloud.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of tableNames) {
    process.stdout.write(`  ⏳ Syncing \`${table}\`...`);

    // Get CREATE TABLE from local
    const [createRows] = await local.query<any[]>(`SHOW CREATE TABLE \`${table}\``);
    const createSQL: string = createRows[0]['Create Table'];

    // Drop and recreate in TiDB
    await cloud.query(`DROP TABLE IF EXISTS \`${table}\``);
    await cloud.query(createSQL);

    // Get all rows from local
    const [rows] = await local.query<any[]>(`SELECT * FROM \`${table}\``);

    if (rows.length === 0) {
      console.log(` skipped (empty)`);
      continue;
    }

    // Build batch inserts (250 rows at a time)
    const columns = Object.keys(rows[0]);
    const colList = columns.map(c => `\`${c}\``).join(', ');
    const batchSize = 250;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const placeholders = batch.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
      const values = batch.flatMap(row => columns.map(col => {
        const val = row[col];
        // Convert Buffer (binary) to string
        if (Buffer.isBuffer(val)) return val.toString();
        return val;
      }));
      await cloud.query(`INSERT INTO \`${table}\` (${colList}) VALUES ${placeholders}`, values);
    }

    console.log(` ✅ ${rows.length} rows`);
  }

  await cloud.query('SET FOREIGN_KEY_CHECKS = 1');

  await local.destroy();
  await cloud.destroy();

  console.log('\n🎉 Done! Local database successfully pushed to TiDB.');
}

run().catch(err => {
  console.error('\n❌ FAILED:', err.message);
  process.exit(1);
});
