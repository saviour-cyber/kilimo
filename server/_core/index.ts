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
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
    iotCoreApi.bootProviders();   // IoT Engine — starts all registered providers
    deviceMonitor.start();        // IoT Engine — monitors device & gateway health
  });
}

startServer().catch(console.error);
console.log('--- ENTERING INDEX.TS ---');
