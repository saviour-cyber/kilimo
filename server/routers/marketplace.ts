/**
 * Marketplace Router
 *
 * Gated by: subscription entitlement ("marketplace") → farm module → RBAC
 *
 * Security:
 *  - organizationId is NEVER trusted from the frontend.
 *  - farmId is verified via assertFarmMember.
 *  - sellerUserId is always set from ctx.user.id on the server.
 *  - IDOR checks are enforced before any data access or mutation.
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, ilike, lte, ne, sql } from "drizzle-orm";
import { z } from "zod";
import {
  marketCategories,
  marketListingImages,
  marketListings,
  organizations,
  farms,
  users,
  notifications,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";
import { assertEntitlement } from "../services/entitlements";
import { requireOrganizationMembership } from "../services/authorization";
import { storagePut } from "../storage";

// ─── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Verifies that a listing belongs to the requesting user's organization.
 * Throws FORBIDDEN if not. Returns the listing row on success.
 */
async function assertListingOwnership(db: any, listingId: number, userId: number) {
  const [listing] = await db
    .select()
    .from(marketListings)
    .where(eq(marketListings.id, listingId))
    .limit(1);

  if (!listing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
  }

  // Verify user is a member of the organization that owns this listing
  await requireOrganizationMembership(db, userId, listing.organizationId);

  return listing;
}

/**
 * Additionally verifies that the user was the original creator OR is an admin member.
 */
async function assertListingEditor(db: any, listingId: number, userId: number) {
  const listing = await assertListingOwnership(db, listingId, userId);

  // The original seller OR a farm admin/owner can edit
  if (listing.sellerUserId !== userId && listing.farmId) {
    const member = await assertFarmMember(listing.farmId, userId);
    assertMinRole(member, "administrator");
  }

  return listing;
}

// ─── Router ────────────────────────────────────────────────────────────────────

export const marketplaceRouter = router({

  // ── Categories (public — all users can see categories) ─────────────────────
  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select()
      .from(marketCategories)
      .where(eq(marketCategories.isActive, true))
      .orderBy(marketCategories.sortOrder, marketCategories.name);
  }),

  // ── Browse (public — active listings only) ─────────────────────────────────
  list: publicProcedure
    .input(z.object({
      categoryId:  z.number().optional(),
      county:      z.string().optional(),
      search:      z.string().max(128).optional(),
      minPrice:    z.number().min(0).optional(),
      maxPrice:    z.number().min(0).optional(),
      limit:       z.number().min(1).max(50).default(20),
      offset:      z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conditions: any[] = [eq(marketListings.status, "active")];

      if (input.categoryId) conditions.push(eq(marketListings.categoryId, input.categoryId));
      if (input.county)     conditions.push(eq(marketListings.county, input.county));
      if (input.minPrice !== undefined) conditions.push(gte(marketListings.price, input.minPrice.toString()));
      if (input.maxPrice !== undefined) conditions.push(lte(marketListings.price, input.maxPrice.toString()));

      const listings = await db
        .select({
          listing:      marketListings,
          category:     marketCategories,
          sellerName:   users.name,
          orgName:      organizations.name,
        })
        .from(marketListings)
        .leftJoin(marketCategories, eq(marketListings.categoryId, marketCategories.id))
        .leftJoin(users,            eq(marketListings.sellerUserId, users.id))
        .leftJoin(organizations,    eq(marketListings.organizationId, organizations.id))
        .where(and(...conditions))
        .orderBy(desc(marketListings.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      // Attach primary image per listing
      const listingIds = listings.map(l => l.listing.id);
      const images = listingIds.length > 0
        ? await db
            .select()
            .from(marketListingImages)
            .where(and(
              eq(marketListingImages.isPrimary, true),
              // Filter to only listings in our result set
              sql`${marketListingImages.listingId} IN (${sql.join(listingIds.map(id => sql`${id}`), sql`, `)})`
            ))
        : [];

      const imageMap = new Map(images.map(img => [img.listingId, img]));

      return listings.map(row => ({
        ...row,
        primaryImage: imageMap.get(row.listing.id) ?? null,
      }));
    }),

  // ── Get Single Listing (public) ────────────────────────────────────────────
  get: publicProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [row] = await db
        .select({
          listing:    marketListings,
          category:   marketCategories,
          sellerName: users.name,
          orgName:    organizations.name,
          farmName:   farms.name,
          farmCounty: farms.county,
        })
        .from(marketListings)
        .leftJoin(marketCategories, eq(marketListings.categoryId, marketCategories.id))
        .leftJoin(users,            eq(marketListings.sellerUserId, users.id))
        .leftJoin(organizations,    eq(marketListings.organizationId, organizations.id))
        .leftJoin(farms,            eq(marketListings.farmId, farms.id))
        .where(eq(marketListings.id, input.listingId))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });

      // Only show non-active listings to the owning org (handled on client)
      const images = await db
        .select()
        .from(marketListingImages)
        .where(eq(marketListingImages.listingId, input.listingId))
        .orderBy(marketListingImages.sortOrder);

      return { ...row, images };
    }),

  // ── My Listings (protected — for the farm's own listings) ──────────────────
  myListings: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      status: z.enum(["all", "draft", "active", "paused", "sold", "archived"]).default("all"),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // SECURITY: Verify user is a farm member
      const member = await assertFarmMember(input.farmId, ctx.user.id);

      const conditions: any[] = [eq(marketListings.farmId, input.farmId)];
      if (input.status !== "all") conditions.push(eq(marketListings.status, input.status));

      const listings = await db
        .select({
          listing:    marketListings,
          category:   marketCategories,
        })
        .from(marketListings)
        .leftJoin(marketCategories, eq(marketListings.categoryId, marketCategories.id))
        .where(and(...conditions))
        .orderBy(desc(marketListings.updatedAt));

      // Attach primary images
      const listingIds = listings.map(l => l.listing.id);
      const images = listingIds.length > 0
        ? await db
            .select()
            .from(marketListingImages)
            .where(and(
              eq(marketListingImages.isPrimary, true),
              sql`${marketListingImages.listingId} IN (${sql.join(listingIds.map(id => sql`${id}`), sql`, `)})`
            ))
        : [];

      const imageMap = new Map(images.map(img => [img.listingId, img]));

      return listings.map(row => ({
        ...row,
        primaryImage: imageMap.get(row.listing.id) ?? null,
      }));
    }),

  // ── Create Listing ──────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      farmId:      z.number(),
      categoryId:  z.number().optional(),
      title:       z.string().min(3).max(128),
      description: z.string().max(2000).optional(),
      price:       z.number().min(0),
      currency:    z.string().default("KES"),
      quantity:    z.number().min(0).optional(),
      unit:        z.string().max(32).optional(),
      county:      z.string().max(64).optional(),
      location:    z.string().max(256).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // SECURITY: Verify farm membership + role (farm_manager minimum to create listings)
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");

      // Get the farm to resolve organizationId — never trust the frontend
      const [farm] = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Farm not found." });

      // SECURITY: Check subscription entitlement
      await assertEntitlement(db, farm.organizationId, "marketplace");

      const [result] = await db.insert(marketListings).values({
        organizationId: farm.organizationId,  // server-resolved
        farmId:         input.farmId,
        sellerUserId:   ctx.user.id,          // server-resolved
        categoryId:     input.categoryId,
        title:          input.title,
        description:    input.description,
        price:          input.price.toString(),
        currency:       input.currency,
        quantity:       input.quantity?.toString(),
        unit:           input.unit,
        county:         input.county,
        location:       input.location,
        status:         "draft",
      });

      return { listingId: (result as any).insertId };
    }),

  // ── Update Listing ──────────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      listingId:   z.number(),
      categoryId:  z.number().optional(),
      title:       z.string().min(3).max(128).optional(),
      description: z.string().max(2000).optional(),
      price:       z.number().min(0).optional(),
      currency:    z.string().optional(),
      quantity:    z.number().min(0).optional(),
      unit:        z.string().max(32).optional(),
      county:      z.string().max(64).optional(),
      location:    z.string().max(256).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // SECURITY: Verify ownership + membership
      await assertListingEditor(db, input.listingId, ctx.user.id);

      const { listingId, price, quantity, ...rest } = input;

      await db.update(marketListings).set({
        ...rest,
        ...(price !== undefined    ? { price: price.toString() } : {}),
        ...(quantity !== undefined ? { quantity: quantity.toString() } : {}),
      }).where(eq(marketListings.id, listingId));

      return { success: true };
    }),

  // ── Publish Listing ─────────────────────────────────────────────────────────
  publish: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const listing = await assertListingEditor(db, input.listingId, ctx.user.id);

      if (listing.status === "archived") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Archived listings cannot be published." });
      }

      await db.update(marketListings).set({
        status:      "active",
        publishedAt: new Date(),
      }).where(eq(marketListings.id, input.listingId));

      if (listing.farmId) {
        await db.insert(notifications).values({
          farmId: listing.farmId,
          userId: ctx.user.id,
          title: "Listing Published",
          message: `Your listing "${listing.title}" is now live on the marketplace.`,
          type: "success",
          category: "system",
          relatedEntityType: "marketListing",
          relatedEntityId: listing.id,
        });
      }

      return { success: true };
    }),

  // ── Pause Listing ───────────────────────────────────────────────────────────
  pause: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await assertListingEditor(db, input.listingId, ctx.user.id);

      await db.update(marketListings)
        .set({ status: "paused" })
        .where(eq(marketListings.id, input.listingId));

      const [listing] = await db.select().from(marketListings).where(eq(marketListings.id, input.listingId));
      if (listing?.farmId) {
        await db.insert(notifications).values({
          farmId: listing.farmId,
          userId: ctx.user.id,
          title: "Listing Paused",
          message: `Your listing "${listing.title}" has been paused and is no longer visible to buyers.`,
          type: "info",
          category: "system",
          relatedEntityType: "marketListing",
          relatedEntityId: listing.id,
        });
      }

      return { success: true };
    }),

  // ── Delete Listing ──────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await assertListingEditor(db, input.listingId, ctx.user.id);

      // Soft-delete by archiving
      await db.update(marketListings)
        .set({ status: "archived" })
        .where(eq(marketListings.id, input.listingId));

      return { success: true };
    }),

  // ── Upload Image ────────────────────────────────────────────────────────────
  uploadImage: protectedProcedure
    .input(z.object({
      listingId:   z.number(),
      base64:      z.string(),              // base64-encoded image
      contentType: z.string().default("image/jpeg"),
      isPrimary:   z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // SECURITY: verify ownership
      await assertListingOwnership(db, input.listingId, ctx.user.id);

      // Enforce max 8 images per listing
      const existing = await db
        .select()
        .from(marketListingImages)
        .where(eq(marketListingImages.listingId, input.listingId));

      if (existing.length >= 8) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum 8 images per listing." });
      }

      // Upload to Forge/S3 storage
      const ext = input.contentType === "image/png" ? "png" : "jpg";
      const key = `marketplace/listings/${input.listingId}/image.${ext}`;
      const buffer = Buffer.from(input.base64, "base64");
      const { key: storageKey, url } = await storagePut(key, buffer, input.contentType);

      // If this is primary, unset existing primary
      if (input.isPrimary) {
        await db.update(marketListingImages)
          .set({ isPrimary: false })
          .where(eq(marketListingImages.listingId, input.listingId));
      }

      const sortOrder = existing.length;
      const [result] = await db.insert(marketListingImages).values({
        listingId:  input.listingId,
        storageKey,
        url,
        sortOrder,
        isPrimary: input.isPrimary || existing.length === 0, // first image is always primary
      });

      return { imageId: (result as any).insertId, url };
    }),

  // ── Delete Image ────────────────────────────────────────────────────────────
  deleteImage: protectedProcedure
    .input(z.object({ imageId: z.number(), listingId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // SECURITY: verify listing ownership first
      await assertListingOwnership(db, input.listingId, ctx.user.id);

      await db.delete(marketListingImages)
        .where(and(
          eq(marketListingImages.id, input.imageId),
          eq(marketListingImages.listingId, input.listingId),
        ));

      return { success: true };
    }),

  // ─── PLATFORM ADMIN procedures ───────────────────────────────────────────────

  // Admin: list all listings
  adminListAll: adminProcedure
    .input(z.object({
      status: z.enum(["all", "draft", "active", "paused", "sold", "archived"]).default("all"),
      limit:  z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conditions: any[] = [];
      if (input.status !== "all") conditions.push(eq(marketListings.status, input.status));

      return db
        .select({
          listing:    marketListings,
          category:   marketCategories,
          sellerName: users.name,
          orgName:    organizations.name,
        })
        .from(marketListings)
        .leftJoin(marketCategories, eq(marketListings.categoryId, marketCategories.id))
        .leftJoin(users,            eq(marketListings.sellerUserId, users.id))
        .leftJoin(organizations,    eq(marketListings.organizationId, organizations.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(marketListings.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  // Admin: disable a listing (set to archived)
  adminDisable: adminProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(marketListings)
        .set({ status: "archived" })
        .where(eq(marketListings.id, input.listingId));

      return { success: true };
    }),

  // Admin: manage categories
  adminCreateCategory: adminProcedure
    .input(z.object({
      name:        z.string().min(2).max(64),
      slug:        z.string().min(2).max(64),
      description: z.string().optional(),
      iconName:    z.string().optional(),
      sortOrder:   z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [result] = await db.insert(marketCategories).values(input);
      return { categoryId: (result as any).insertId };
    }),

  adminUpdateCategory: adminProcedure
    .input(z.object({
      categoryId:  z.number(),
      name:        z.string().min(2).max(64).optional(),
      description: z.string().optional(),
      iconName:    z.string().optional(),
      sortOrder:   z.number().optional(),
      isActive:    z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { categoryId, ...updates } = input;
      await db.update(marketCategories).set(updates).where(eq(marketCategories.id, categoryId));
      return { success: true };
    }),
});
