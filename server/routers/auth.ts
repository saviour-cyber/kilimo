import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { users, emailVerificationTokens, passwordResetTokens } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { SignJWT } from "jose";
import { createHash, randomBytes } from "crypto";
import { emailService } from "../services/email";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kilisense-secret-key-development",
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a cryptographically random token and its SHA-256 hash */
function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex"); // 64-char hex string
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export const authRouter = router({
  // ── Who am I ────────────────────────────────────────────────────────────────
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),

  // ── Logout ──────────────────────────────────────────────────────────────────
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  // ── Login ────────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      const password = input.password;

      const userResult = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      const user = userResult[0];

      if (!user || !user.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      if (!user.isEmailVerified) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Please verify your email address to log in." });
      }

      const updateFields: Record<string, unknown> = { lastSignedIn: new Date() };

      await ctx.db
        .update(users)
        .set(updateFields)
        .where(eq(users.id, user.id));

      const token = await new SignJWT({ userId: user.id })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return { success: true, user: { id: user.id, name: user.name, email: user.email } };
    }),

  // ── Admin Login ──────────────────────────────────────────────────────────────
  adminLogin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();

      const userResult = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      const user = userResult[0];

      // Check user exists and is an admin
      if (!user || user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied. This portal is restricted to platform administrators." });
      }

      if (!user.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });
      }

      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });
      }

      // Update last sign-in
      await ctx.db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      const token = await new SignJWT({ userId: user.id })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return { success: true, user: { id: user.id, name: user.name, email: user.email } };
    }),

  // ── Register ─────────────────────────────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        password: z.string().min(1),
        country: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email is already in use" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const name = `${input.firstName} ${input.lastName}`.trim();

      const [result] = await ctx.db.insert(users).values({
        email: input.email,
        name,
        phone: input.phone,
        country: input.country,
        password: hashedPassword,
        loginMethod: "local",
        openId: input.email,
      });

      const userId = (result as any).insertId as number;

      // ── Do not issue JWT here (wait for email verification) ───────────────

      // ── Send verification email (non-blocking) ─────────────────────────────
      setImmediate(async () => {
        try {
          const { raw, hash } = generateToken();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

          await ctx.db.insert(emailVerificationTokens).values({
            userId,
            tokenHash: hash,
            expiresAt,
          });

          await emailService.sendVerificationEmail({ name, email: input.email }, raw);

          // Also send a welcome email
          await emailService.sendWelcomeEmail({ name, email: input.email });
        } catch (err) {
          console.error("[auth.register] Failed to send verification email:", err);
        }
      });

      return { success: true, userId, name, email: input.email, requiresVerification: true };
    }),

  // ── Verify Email ─────────────────────────────────────────────────────────────
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const hash = createHash("sha256").update(input.token).digest("hex");
      const now = new Date();

      const [record] = await ctx.db
        .select()
        .from(emailVerificationTokens)
        .where(
          and(
            eq(emailVerificationTokens.tokenHash, hash),
            gt(emailVerificationTokens.expiresAt, now),
          ),
        )
        .limit(1);

      if (!record) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification link is invalid or has expired.",
        });
      }

      if (record.usedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This verification link has already been used.",
        });
      }

      // Mark token as used
      await ctx.db
        .update(emailVerificationTokens)
        .set({ usedAt: now })
        .where(eq(emailVerificationTokens.id, record.id));

      // Mark user as verified
      await ctx.db
        .update(users)
        .set({ isEmailVerified: true })
        .where(eq(users.id, record.userId));

      // ── Issue session JWT ──────────────────────────────────────────────────
      const sessionToken = await new SignJWT({ userId: record.userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return { success: true, userId: record.userId };
    }),

  // ── Forgot Password ──────────────────────────────────────────────────────────
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      // Always return success to avoid user enumeration
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (user) {
        try {
          const { raw, hash } = generateToken();
          const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

          await ctx.db.insert(passwordResetTokens).values({
            userId: user.id,
            tokenHash: hash,
            expiresAt,
          });

          await emailService.sendPasswordResetEmail(
            { name: user.name ?? "Farmer", email: user.email! },
            raw,
          );
        } catch (err) {
          console.error("[auth.forgotPassword] Error:", err);
        }
      }

      return { success: true };
    }),

  // ── Reset Password ───────────────────────────────────────────────────────────
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const hash = createHash("sha256").update(input.token).digest("hex");
      const now = new Date();

      const [record] = await ctx.db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, hash),
            gt(passwordResetTokens.expiresAt, now),
          ),
        )
        .limit(1);

      if (!record) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reset link is invalid or has expired.",
        });
      }

      if (record.usedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link has already been used.",
        });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      await ctx.db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, record.userId));

      // Invalidate token immediately (single-use)
      await ctx.db
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, record.id));

      return { success: true };
    }),

  // ── Resend Verification Email ────────────────────────────────────────────────
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (user) {
        try {
          const { raw, hash } = generateToken();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

          await ctx.db.insert(emailVerificationTokens).values({
            userId: user.id,
            tokenHash: hash,
            expiresAt,
          });

          await emailService.sendVerificationEmail(
            { name: user.name ?? "Farmer", email: user.email! },
            raw,
          );
        } catch (err) {
          console.error("[auth.resendVerification] Error:", err);
        }
      }

      // Always return success to avoid user enumeration
      return { success: true };
    }),
});
