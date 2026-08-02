require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection({ 
      uri: process.env.DATABASE_URL, 
      ssl: { rejectUnauthorized: false } 
    });
    
    // Describe activitylogs
    const [desc] = await conn.execute('DESCRIBE activitylogs');
    console.log('activitylogs columns:');
    desc.forEach(col => console.log(' ', col.Field, col.Type, col.Null, col.Key, col.Default));

    conn.destroy();
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
})();
