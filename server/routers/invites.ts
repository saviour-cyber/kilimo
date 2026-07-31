import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { farmInvites, farmMembers } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const invitesRouter = router({
  // ── Send Invite ────────────────────────────────────────────────────────────────
  sendInvite: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      email: z.string().email(),
      farmRole: z.enum(["administrator", "farm_manager", "worker", "veterinary_officer", "crop_officer", "viewer"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check permissions
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      // Generate invite token and expiry (7 days)
      const inviteToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create invite
      const [result] = await db.insert(farmInvites).values({
        farmId: input.farmId,
        email: input.email,
        farmRole: input.farmRole,
        invitedByUserId: ctx.user.id,
        inviteToken,
        expiresAt,
        status: "pending",
      });

      return {
        inviteId: (result as any).insertId,
        inviteToken,
        expiresAt: expiresAt.toISOString(),
      };
    }),

  // ── List Pending Invites ───────────────────────────────────────────────────────
  listInvites: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await assertFarmMember(input.farmId, ctx.user.id);

      return db
        .select()
        .from(farmInvites)
        .where(and(eq(farmInvites.farmId, input.farmId), eq(farmInvites.status, "pending")));
    }),

  // ── Accept Invite (public, token-based) ────────────────────────────────────────
  acceptInvite: protectedProcedure
    .input(z.object({ inviteToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Find invite by token
      const invite = (
        await db
          .select()
          .from(farmInvites)
          .where(eq(farmInvites.inviteToken, input.inviteToken))
          .limit(1)
      )[0];

      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Invite already processed" });
      if (new Date() > new Date(invite.expiresAt)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite expired" });

      // Check email matches
      if (invite.email !== ctx.user.email) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invite email does not match your account" });
      }

      // Check if user is already a member
      const existing = (
        await db
          .select()
          .from(farmMembers)
          .where(and(eq(farmMembers.farmId, invite.farmId), eq(farmMembers.userId, ctx.user.id)))
          .limit(1)
      )[0];

      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already a member of this farm" });
      }

      // Add user to farm
      await db.insert(farmMembers).values({
        farmId: invite.farmId,
        userId: ctx.user.id,
        farmRole: invite.farmRole,
        invitedByUserId: invite.invitedByUserId,
        joinedAt: new Date(),
      });

      // Mark invite as accepted
      await db
        .update(farmInvites)
        .set({
          status: "accepted",
          acceptedByUserId: ctx.user.id,
          acceptedAt: new Date(),
        })
        .where(eq(farmInvites.id, invite.id));

      return { success: true, farmId: invite.farmId };
    }),

  // ── Cancel Invite ──────────────────────────────────────────────────────────────
  cancelInvite: protectedProcedure
    .input(z.object({ inviteId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      const invite = (
        await db
          .select()
          .from(farmInvites)
          .where(and(eq(farmInvites.id, input.inviteId), eq(farmInvites.farmId, input.farmId)))
          .limit(1)
      )[0];

      if (!invite) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(farmInvites)
        .set({ status: "cancelled" })
        .where(eq(farmInvites.id, input.inviteId));

      return { success: true };
    }),

  // ── Get Invite by Token (public, for acceptance page) ─────────────────────────
  getInviteByToken: protectedProcedure
    .input(z.object({ inviteToken: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const invite = (
        await db
          .select()
          .from(farmInvites)
          .where(eq(farmInvites.inviteToken, input.inviteToken))
          .limit(1)
      )[0];

      if (!invite) throw new TRPCError({ code: "NOT_FOUND" });
      if (invite.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Invite already processed" });
      if (new Date() > new Date(invite.expiresAt)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite expired" });

      return {
        id: invite.id,
        email: invite.email,
        farmRole: invite.farmRole,
        expiresAt: invite.expiresAt,
      };
    }),

  // ── Cleanup Expired Invites (admin/system) ─────────────────────────────────────
  cleanupExpiredInvites: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Only allow admin users or system calls
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const result = await db
      .update(farmInvites)
      .set({ status: "expired" })
      .where(and(lt(farmInvites.expiresAt, new Date()), eq(farmInvites.status, "pending")));

    return { success: true };
  }),
});
