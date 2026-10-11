import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

import mysql from "mysql2/promise";

let _db: ReturnType<typeof drizzle> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pool: any = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // TiDB and other cloud providers often require SSL.
      // Providing the URL to createPool handles complex connection strings robustly.
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 10,
        ssl: process.env.DATABASE_URL.includes('tidb') || process.env.DATABASE_URL.includes('ssl=') ? { rejectUnauthorized: false } : undefined,
      });
      _db = drizzle(_pool);

      // Self-healing: verify isSuspended column and email automation tables
      (async () => {
        try {
          const [cols]: any = await _pool.query(
            `SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'isSuspended'`
          );
          if (cols && cols.length === 0) {
            console.log("[Database] Adding missing 'isSuspended' column to users table...");
            await _pool.query("ALTER TABLE `users` ADD COLUMN `isSuspended` tinyint(1) NOT NULL DEFAULT 0");
            console.log("[Database] Successfully added 'isSuspended' column to users table.");
          }

          // Ensure email automation tables exist
          await _pool.query(`
            CREATE TABLE IF NOT EXISTS \`emailAutomationLogs\` (
              \`id\` int AUTO_INCREMENT NOT NULL,
              \`organizationId\` int,
              \`userId\` int,
              \`recipientEmail\` varchar(320) NOT NULL,
              \`automationType\` varchar(64) NOT NULL,
              \`status\` enum('sent','failed','skipped') NOT NULL DEFAULT 'sent',
              \`errorMessage\` text,
              \`metadata\` json,
              \`sentAt\` timestamp NOT NULL DEFAULT (now()),
              PRIMARY KEY (\`id\`)
            )
          `);

          await _pool.query(`
            CREATE TABLE IF NOT EXISTS \`userEmailPreferences\` (
              \`userId\` int NOT NULL,
              \`billingEmails\` boolean NOT NULL DEFAULT true,
              \`agriInsightEmails\` boolean NOT NULL DEFAULT true,
              \`farmDigestEmails\` boolean NOT NULL DEFAULT true,
              \`securityEmails\` boolean NOT NULL DEFAULT true,
              \`unsubscribeToken\` varchar(64),
              \`createdAt\` timestamp NOT NULL DEFAULT (now()),
              \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (\`userId\`),
              UNIQUE KEY \`userEmailPreferences_unsubscribeToken_unique\` (\`unsubscribeToken\`)
            )
          `);
        } catch (e: any) {
          console.warn("[Database] Schema check warning:", e.message);
        }
      })();
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
