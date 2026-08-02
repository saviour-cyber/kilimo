require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection({ 
      uri: process.env.DATABASE_URL, 
      ssl: { rejectUnauthorized: false } 
    });
    
    // Show all tables first
    const [tables] = await conn.execute('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));
    
    conn.destroy();
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
})();
