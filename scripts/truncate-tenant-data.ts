import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({ 
    uri: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  
  console.log('Disabling foreign key checks...');
  await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
  
  const tables = [
    'organizationMembers',
    'subscriptions',
    'subscriptionInvoices',
    'farmMembers',
    'fields',
    'crops',
    'activities',
    'equipments',
    'inventories',
    'harvests',
    'marketplaceListings',
    'farms',
    'organizations'
  ];
  
  for (const table of tables) {
    try {
      console.log(`Truncating ${table}...`);
      await connection.execute(`TRUNCATE TABLE ${table}`);
      console.log(`✓ ${table} truncated.`);
    } catch (e) {
      console.warn(`Skipped ${table}: ${e.message}`);
    }
  }
  
  console.log('Re-enabling foreign key checks...');
  await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  
  await connection.end();
  console.log('All organizations and farm data successfully cleared!');
}

main().catch(e => { 
  console.error(e); 
  process.exit(1); 
}).then(() => process.exit(0));
