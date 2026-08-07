console.log("--- ENTERING INDEX.TS ---");
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { generateRemindersHandler } from "../scheduled/generateReminders";
import { iotCoreApi } from "../services/iot/IotCoreApi";
import { deviceMonitor } from "../services/iot/DeviceMonitor";
import { aiEventHandler } from "../services/ai/aiEventHandler";
import { iotEventService } from "../services/iot/IotEventService"; // ensure singleton boots


async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Scheduled job handlers
  app.post("/api/scheduled/generateReminders", generateRemindersHandler);

  // DEBUG: confirm Express receives /verify-email requests (remove after confirming)
  app.get("/verify-email", (req, res, next) => {
    console.log("VERIFY EMAIL ROUTE HIT — Express is alive and handling this request");
    next();
  });

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
