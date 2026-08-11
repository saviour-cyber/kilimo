import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({ 
    uri: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  
  console.log('Deleting all regular users...');
  
  try {
    // Delete all users who are NOT admins
    const [result] = await connection.execute('DELETE FROM users WHERE role != ?', ['admin']);
    console.log(`✓ Deleted ${(result as any).affectedRows} user(s).`);
  } catch (e: any) {
    console.error('Failed to delete users:', e.message);
  }
  
  await connection.end();
  console.log('User cleanup complete!');
}

main().catch(e => { 
  console.error(e); 
  process.exit(1); 
}).then(() => process.exit(0));
