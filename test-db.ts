import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { platformAnnouncements, auditLogs } from './drizzle/schema';

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection({ 
      uri: process.env.DATABASE_URL, 
      ssl: { rejectUnauthorized: true } 
    });
    
    console.log('Connected!');
    
    const db = drizzle(conn);
    
    console.log('Trying to insert announcement...');
    const [result] = await db.insert(platformAnnouncements).values({
      title: 'maintenace',
      content: 'maitence mode',
      type: 'critical'
    });
    console.log('Insert result:', result);

    process.exit(0);
  } catch (err) {
    console.error('ERROR OCCURRED:');
    console.error(err);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();
