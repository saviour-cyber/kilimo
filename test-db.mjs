import 'dotenv/config';
import mysql from 'mysql2/promise';

async function test() {
  console.log('Connecting to', process.env.DATABASE_URL);
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const query = 'insert into farms (organizationId, name, sizeHectares, currency, timezone, ownerId) values (?, ?, ?, ?, ?, ?)';
    const params = [120006, 'ian farms', 70, 'KES', 'Africa/Nairobi', 120001];
    console.log('Running query...');
    await pool.query(query, params);
    console.log('Success!');
  } catch(e) {
    console.error('DB Error:', e.message);
    if(e.sqlMessage) console.error('SQL Message:', e.sqlMessage);
  } finally {
    pool.end();
  }
}
test();
