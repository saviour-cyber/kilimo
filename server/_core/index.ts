console.log("--- ENTERING INDEX.TS ---");
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { webhooksRouter } from "../routers/webhooks";
import { invoicesRouter } from "../routers/invoices";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { generateRemindersHandler } from "../scheduled/generateReminders";
import { enforceSubscriptionsHandler } from "../scheduled/enforceSubscriptions";
import { iotCoreApi } from "../services/iot/IotCoreApi";
import { deviceMonitor } from "../services/iot/DeviceMonitor";
import { aiEventHandler } from "../services/ai/aiEventHandler";
import { iotEventService } from "../services/iot/IotEventService"; // ensure singleton boots


async function startServer() {
  const app = express();
  const server = createServer(app);

  // Webhooks must be mounted BEFORE express.json() so they can access the raw body
  app.use("/api/webhooks", webhooksRouter);

  // Invoices endpoint for PDF generation
  app.use("/api/invoices", invoicesRouter);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Scheduled job handlers
  app.post("/api/scheduled/generateReminders", generateRemindersHandler);
  app.post("/api/scheduled/enforceSubscriptions", enforceSubscriptionsHandler);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Temporary route to fix the database
  app.get('/api/fix-db', async (req, res) => {
    try {
      const { getDb } = await import('../db');
      const db = await getDb();
      if (!db) {
        res.status(500).send('No database connection');
        return;
      }
      
      const pool = require('mysql2/promise').createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        multipleStatements: true
      });
      
      const sql = \
        ALTER TABLE \\\subscriptionPlans\\\
          ADD COLUMN IF NOT EXISTS \\\isRecommended\\\ boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS \\\isDefaultTrial\\\ boolean NOT NULL DEFAULT false;

        ALTER TABLE \\\arms\\\
          ADD COLUMN IF NOT EXISTS \\\latitude\\\ decimal(10,6),
          ADD COLUMN IF NOT EXISTS \\\longitude\\\ decimal(10,6);

        CREATE TABLE IF NOT EXISTS \\\platformEmailLogs\\\ (
          \\\id\\\ int AUTO_INCREMENT NOT NULL,
          \\\senderId\\\ int,
          \\\ecipient\\\ varchar(320) NOT NULL,
          \\\subject\\\ varchar(256) NOT NULL,
          \\\	emplateKey\\\ varchar(64) NOT NULL,
          \\\status\\\ enum('queued','sent','delivered','failed') NOT NULL DEFAULT 'queued',
          \\\providerMessageId\\\ varchar(128),
          \\\errorMessage\\\ text,
          \\\sentAt\\\ timestamp NOT NULL DEFAULT (now()),
          \\\deliveredAt\\\ timestamp,
          \\\ailedAt\\\ timestamp,
          CONSTRAINT \\\platformEmailLogs_id\\\ PRIMARY KEY(\\\id\\\)
        );

        CREATE TABLE IF NOT EXISTS \\\weatherCache\\\ (
          \\\id\\\ int AUTO_INCREMENT NOT NULL,
          \\\latitude\\\ decimal(10,2) NOT NULL,
          \\\longitude\\\ decimal(10,2) NOT NULL,
          \\\dataType\\\ varchar(32) NOT NULL,
          \\\provider\\\ varchar(64) NOT NULL DEFAULT 'open-meteo',
          \\\payload\\\ json NOT NULL,
          \\\etchedAt\\\ timestamp NOT NULL DEFAULT (now()),
          \\\expiresAt\\\ timestamp NOT NULL,
          CONSTRAINT \\\weatherCache_id\\\ PRIMARY KEY(\\\id\\\)
        );
      \;
      
      await pool.query(sql);
      res.send('Database fixed successfully!');
    } catch(err) {
      res.status(500).send('Error fixing database: ' + err.message);
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
    iotCoreApi.bootProviders();   // IoT Engine â€” starts all registered providers
    deviceMonitor.start();        // IoT Engine â€” monitors device & gateway health
  });
}

startServer().catch(console.error);
console.log('--- ENTERING INDEX.TS ---');

