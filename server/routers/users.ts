import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const usersRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    return user;
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      preferredLanguage: z.string().optional(),
      timezone: z.string().optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(users).set({
        name: input.name,
        phone: input.phone,
        preferredLanguage: input.preferredLanguage,
        timezone: input.timezone,
        theme: input.theme,
      }).where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user || !user.password) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No password set on this account" });
      }

      const valid = await bcrypt.compare(input.currentPassword, user.password);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      }

      const hashed = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({ password: hashed }).where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
