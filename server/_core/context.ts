import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
};

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kilisense-secret-key-development"
);

import { parse } from "cookie";

async function getUserFromRequest(
  req: CreateExpressContextOptions["req"]
): Promise<User | null> {
  try {
    const cookies = parse(req.headers.cookie || "");
    const token = cookies[COOKIE_NAME];
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    if (!userId) return null;

    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return result[0] ?? null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await getUserFromRequest(opts.req);

  const db = await getDb();
  if (!db) {
    throw new Error("Database not initialized");
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    db,
  };
}
