import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Use process.cwd() so the path is always relative to the project root,
  // whether the server is running from source (tsx) or from dist/index.js (esbuild).
  const distPath = path.resolve(process.cwd(), "dist", "public");
  const indexPath = path.resolve(distPath, "index.html");

  if (!fs.existsSync(distPath)) {
    console.error(
      `[serveStatic] ERROR: Build directory not found: ${distPath}. Run "npm run build" first.`
    );
  } else if (!fs.existsSync(indexPath)) {
    console.error(
      `[serveStatic] ERROR: index.html not found at: ${indexPath}`
    );
  } else {
    console.log(`[serveStatic] Serving static files from: ${distPath}`);
  }

  // 1. Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(distPath));

  // 2. SPA catch-all: any GET request that didn't match a static file or /api/* route
  //    must return index.html so React Router can handle client-side routing.
  //    This covers /verify-email, /login, /register, /forgot-password, /reset-password, etc.
  //    Using app.get() is more explicit and reliable in Express 4 than app.use("*").
  app.get("*", (_req, res) => {
    if (!fs.existsSync(indexPath)) {
      res.status(500).send("Server error: client build not found. Contact support.");
      return;
    }
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("[serveStatic] Failed to send index.html:", err);
        res.status(500).send("Server error: failed to serve application.");
      }
    });
  });
}
