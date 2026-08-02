import { TRPCError } from "@trpc/server";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { equipment, inventoryItems, stockTransactions, suppliers } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const inventoryRouter = router({
  // ── Inventory Items ───────────────────────────────────────────────────────────
  listItems: protectedProcedure
    .input(z.object({ farmId: z.number(), category: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(inventoryItems.farmId, input.farmId), eq(inventoryItems.isArchived, false)];
      if (input.category) conditions.push(eq(inventoryItems.category, input.category as any));
      return db.select().from(inventoryItems).where(and(...conditions)).orderBy(inventoryItems.name);
    }),

  getLowStockItems: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(inventoryItems).where(
        and(
          eq(inventoryItems.farmId, input.farmId),
          eq(inventoryItems.isArchived, false),
          sql`${inventoryItems.currentStock} <= ${inventoryItems.minimumStock}`
        )
      );
    }),

  createItem: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      name: z.string().min(1).max(128),
      category: z.enum(["seed", "fertilizer", "chemical", "feed", "equipment", "fuel", "packaging", "other"]),
      sku: z.string().optional(),
      unit: z.string().optional(),
      currentStock: z.string().optional(),
      minimumStock: z.string().optional(),
      unitCost: z.string().optional(),
      supplierId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const [result] = await db.insert(inventoryItems).values(input as any);
      return { itemId: (result as any).insertId };
    }),

  updateItem: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      farmId: z.number(),
      name: z.string().optional(),
      category: z.enum(["seed", "fertilizer", "chemical", "feed", "equipment", "fuel", "packaging", "other"]).optional(),
      unit: z.string().optional(),
      minimumStock: z.string().optional(),
      unitCost: z.string().optional(),
      supplierId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { itemId, farmId, ...data } = input;
      await db.update(inventoryItems).set(data as any).where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.farmId, farmId)));
      return { success: true };
    }),

  archiveItem: protectedProcedure
    .input(z.object({ itemId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "farm_manager");
      await db.update(inventoryItems).set({ isArchived: true }).where(and(eq(inventoryItems.id, input.itemId), eq(inventoryItems.farmId, input.farmId)));
      return { success: true };
    }),

  // ── Stock Transactions ────────────────────────────────────────────────────────
  listTransactions: protectedProcedure
    .input(z.object({ farmId: z.number(), itemId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(stockTransactions.farmId, input.farmId)];
      if (input.itemId) conditions.push(eq(stockTransactions.itemId, input.itemId));
      return db.select().from(stockTransactions).where(and(...conditions)).orderBy(desc(stockTransactions.transactionDate));
    }),

  recordTransaction: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      itemId: z.number(),
      transactionType: z.enum(["stock_in", "stock_out", "adjustment"]),
      quantity: z.string(),
      unitCost: z.string().optional(),
      reason: z.string().optional(),
      referenceNumber: z.string().optional(),
      transactionDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const qty = parseFloat(input.quantity);
      const unitCost = input.unitCost ? parseFloat(input.unitCost) : undefined;
      const totalCost = unitCost ? String(qty * unitCost) : undefined;
      const data: any = { ...input, totalCost, recordedByUserId: ctx.user.id };
      if (data.transactionDate) data.transactionDate = new Date(data.transactionDate);
      const [result] = await db.insert(stockTransactions).values(data);
      // Update stock level
      const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, input.itemId)).limit(1);
      if (item) {
        const current = parseFloat(String(item.currentStock)) || 0;
        let newStock = current;
        if (input.transactionType === "stock_in") newStock = current + qty;
        else if (input.transactionType === "stock_out") newStock = Math.max(0, current - qty);
        else newStock = qty; // adjustment = set to value
        await db.update(inventoryItems).set({ currentStock: String(newStock) } as any).where(eq(inventoryItems.id, input.itemId));
      }
      return { transactionId: (result as any).insertId };
    }),

  // ── Equipment ─────────────────────────────────────────────────────────────────
  listEquipment: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(equipment).where(and(eq(equipment.farmId, input.farmId), eq(equipment.isArchived, false))).orderBy(equipment.name);
    }),

  createEquipment: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      name: z.string().min(1).max(128),
      category: z.string().optional(),
      serialNumber: z.string().optional(),
      purchaseDate: z.string().optional(),
      purchaseCost: z.string().optional(),
      status: z.enum(["operational", "maintenance", "repair", "retired"]).optional(),
      nextMaintenanceDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input };
      if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
      if (data.nextMaintenanceDate) data.nextMaintenanceDate = new Date(data.nextMaintenanceDate);
      const [result] = await db.insert(equipment).values(data);
      return { equipmentId: (result as any).insertId };
    }),

  updateEquipment: protectedProcedure
    .input(z.object({
      equipmentId: z.number(),
      farmId: z.number(),
      name: z.string().optional(),
      status: z.enum(["operational", "maintenance", "repair", "retired"]).optional(),
      lastMaintenanceDate: z.string().optional(),
      nextMaintenanceDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { equipmentId, farmId, ...rawData } = input;
      const data: any = { ...rawData };
      if (data.lastMaintenanceDate) data.lastMaintenanceDate = new Date(data.lastMaintenanceDate);
      if (data.nextMaintenanceDate) data.nextMaintenanceDate = new Date(data.nextMaintenanceDate);
      await db.update(equipment).set(data).where(and(eq(equipment.id, equipmentId), eq(equipment.farmId, farmId)));
      return { success: true };
    }),

  // ── Suppliers ─────────────────────────────────────────────────────────────────
  listSuppliers: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      return db.select().from(suppliers).where(and(eq(suppliers.farmId, input.farmId), eq(suppliers.isArchived, false))).orderBy(suppliers.name);
    }),

  createSupplier: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      name: z.string().min(1).max(128),
      contactName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const [result] = await db.insert(suppliers).values(input);
      return { supplierId: (result as any).insertId };
    }),

  // ── Dashboard Summary ─────────────────────────────────────────────────────────
  dashboardSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const [allItems, allEquipment] = await Promise.all([
        db.select().from(inventoryItems).where(and(eq(inventoryItems.farmId, input.farmId), eq(inventoryItems.isArchived, false))),
        db.select().from(equipment).where(and(eq(equipment.farmId, input.farmId), eq(equipment.isArchived, false))),
      ]);

      const lowStockItems = allItems.filter(i =>
        i.minimumStock !== null && parseFloat(String(i.currentStock)) <= parseFloat(String(i.minimumStock))
      );

      return {
        totalItems: allItems.length,
        totalEquipment: allEquipment.length,
        lowStockCount: lowStockItems.length,
        lowStockAlerts: lowStockItems.slice(0, 5).map(i => ({
          id: i.id,
          name: i.name,
          currentStock: String(i.currentStock),
          minimumStock: String(i.minimumStock),
          unit: i.unit,
        })),
      };
    }),
});
