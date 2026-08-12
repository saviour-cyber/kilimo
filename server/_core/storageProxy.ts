import type { Express } from "express";
import path from "path";
import fs from "fs";

export function registerStorageProxy(app: Express) {
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  app.get("/manus-storage/*", (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const fullPath = path.join(UPLOADS_DIR, key);

    // Basic security check to prevent directory traversal
    if (!fullPath.startsWith(UPLOADS_DIR)) {
      res.status(403).send("Forbidden");
      return;
    }

    if (!fs.existsSync(fullPath)) {
      res.status(404).send("File not found");
      return;
    }

    res.set("Cache-Control", "public, max-age=31536000");
    res.sendFile(fullPath);
  });
}
