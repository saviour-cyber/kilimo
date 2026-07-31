import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Parse the URL to extract connection params so we can add SSL for cloud DBs
const parsed = new URL(connectionString.replace(/^mysql:\/\//, "http://"));
const isCloudDb =
  parsed.hostname.includes("tidb") ||
  parsed.hostname.includes("planetscale") ||
  parsed.hostname.includes("amazonaws") ||
  parsed.hostname.includes("cleardb");

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  },
});
