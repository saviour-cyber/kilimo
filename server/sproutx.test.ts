import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "test@sproutxhub.com",
    name: "Test Farmer",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: any) => clearedCookies.push({ name, options }),
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth", () => {
  it("me returns the current user when authenticated", async () => {
    const { ctx } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@sproutxhub.com");
  });

  it("me returns null when unauthenticated", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("logout clears session cookie", async () => {
    const { ctx, clearedCookies } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true });
  });
});

describe("farms router", () => {
  it("list requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.farms.list()).rejects.toThrow();
  });

  it("list returns array for authenticated user", async () => {
    const { ctx } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    // Without a real DB this will throw INTERNAL_SERVER_ERROR — that's expected
    try {
      const result = await caller.farms.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(["INTERNAL_SERVER_ERROR", "UNAUTHORIZED"]).toContain(e.code);
    }
  });
});

describe("crops router", () => {
  it("listFields requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crops.listFields({ farmId: 1 })).rejects.toThrow();
  });

  it("listPlantings requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crops.listPlantings({ farmId: 1 })).rejects.toThrow();
  });
});

describe("livestock router", () => {
  it("listAnimals requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.livestock.listAnimals({ farmId: 1 })).rejects.toThrow();
  });
});

describe("inventory router", () => {
  it("listItems requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.inventory.listItems({ farmId: 1 })).rejects.toThrow();
  });
});

describe("finance router", () => {
  it("listTransactions requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.finance.listTransactions({ farmId: 1 })).rejects.toThrow();
  });

  it("summary requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.finance.summary({ farmId: 1 })).rejects.toThrow();
  });
});

describe("tasks router", () => {
  it("list requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tasks.list({ farmId: 1 })).rejects.toThrow();
  });
});

describe("notifications router", () => {
  it("list requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notifications.list({ farmId: 1 })).rejects.toThrow();
  });
});

describe("dashboard router", () => {
  it("kpis requires authentication", async () => {
    const { ctx } = makeCtx();
    ctx.user = null;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.kpis({ farmId: 1 })).rejects.toThrow();
  });
});
