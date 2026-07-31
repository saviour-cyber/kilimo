import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "kilimo-hub-secret-key-development");

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;
      
      const userResult = await ctx.db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = userResult[0];
      
      if (!user || !user.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      // Update last signed in
      await ctx.db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      const token = await new SignJWT({ userId: user.id })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return { success: true, user: { id: user.id, name: user.name, email: user.email } };
    }),

  register: publicProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      password: z.string().min(1),
      country: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existingUser = await ctx.db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existingUser.length > 0) {
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
        openId: input.email, // Use email as openId since it must be unique and we dropped external OAuth
      });
      
      const userId = result.insertId;

      const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return { success: true, userId, name, email: input.email };
    }),
});
