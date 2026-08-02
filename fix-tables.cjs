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

    // Create platformAnnouncements if it doesn't exist
    console.log('\nCreating platformAnnouncements table...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS platformAnnouncements (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(32) NOT NULL DEFAULT 'info',
        isActive TINYINT(1) NOT NULL DEFAULT 1,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('platformAnnouncements created (or already exists).');

    // Test insert
    console.log('\nTesting insert into platformAnnouncements...');
    const id = require('crypto').randomUUID();
    const [res] = await conn.execute(
      'INSERT INTO platformAnnouncements (id, title, content, type, isActive) VALUES (?, ?, ?, ?, ?)',
      [id, 'maintenace', 'maitence mode', 'critical', 1]
    );
    console.log('Insert result:', res);

    conn.destroy();
  } catch (err) {
    console.error('Error:', err.message, err.sqlState, err.code);
    console.error(err);
  }
  process.exit(0);
})();
