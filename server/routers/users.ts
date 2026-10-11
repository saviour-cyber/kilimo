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

  getEmailPreferences: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const { userEmailPreferences } = await import("../../drizzle/schema");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [pref] = await db
      .select()
      .from(userEmailPreferences)
      .where(eq(userEmailPreferences.userId, ctx.user.id))
      .limit(1);

    if (!pref) {
      return {
        billingEmails: true,
        agriInsightEmails: true,
        farmDigestEmails: true,
        securityEmails: true,
      };
    }

    return {
      billingEmails: pref.billingEmails,
      agriInsightEmails: pref.agriInsightEmails,
      farmDigestEmails: pref.farmDigestEmails,
      securityEmails: pref.securityEmails,
    };
  }),

  updateEmailPreferences: protectedProcedure
    .input(z.object({
      billingEmails: z.boolean().optional(),
      agriInsightEmails: z.boolean().optional(),
      farmDigestEmails: z.boolean().optional(),
      securityEmails: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const { userEmailPreferences } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [existing] = await db
        .select()
        .from(userEmailPreferences)
        .where(eq(userEmailPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(userEmailPreferences)
          .set({
            ...(input.billingEmails !== undefined ? { billingEmails: input.billingEmails } : {}),
            ...(input.agriInsightEmails !== undefined ? { agriInsightEmails: input.agriInsightEmails } : {}),
            ...(input.farmDigestEmails !== undefined ? { farmDigestEmails: input.farmDigestEmails } : {}),
            ...(input.securityEmails !== undefined ? { securityEmails: input.securityEmails } : {}),
          })
          .where(eq(userEmailPreferences.userId, ctx.user.id));
      } else {
        await db.insert(userEmailPreferences).values({
          userId: ctx.user.id,
          billingEmails: input.billingEmails ?? true,
          agriInsightEmails: input.agriInsightEmails ?? true,
          farmDigestEmails: input.farmDigestEmails ?? true,
          securityEmails: input.securityEmails ?? true,
        });
      }

      return { success: true };
    }),
});

