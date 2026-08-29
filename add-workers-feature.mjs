import mysql from 'mysql2/promise';
import 'dotenv/config';

async function addWorkersFeature() {
  let url = process.env.DATABASE_URL;
  if (!url.includes('ssl=')) {
    url += (url.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":true}';
  }
  const connection = await mysql.createConnection(url);
  try {
    const [plans] = await connection.query('SELECT id FROM subscriptionPlans');
    for (const plan of plans) {
      try {
        await connection.query('INSERT IGNORE INTO subscriptionPlanFeatures (planId, featureKey, featureType) VALUES (?, ?, ?)', [plan.id, 'workers', 'module']);
        console.log(`Added workers feature to plan ${plan.id}`);
      } catch(e) {
        console.log(e.message);
      }
    }
    
    // Also add to any existing active subscriptions directly if they bypass plan features for some reason. But subscription features are usually pulled from the plan.
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
addWorkersFeature();