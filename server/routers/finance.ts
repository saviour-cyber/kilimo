import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { budgets, financeTransactions } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertFarmMember, assertMinRole } from "./farms";

export const financeRouter = router({
  // ── Transactions ──────────────────────────────────────────────────────────────
  listTransactions: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      type: z.enum(["income", "expense"]).optional(),
      category: z.string().optional(),
      season: z.string().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(financeTransactions.farmId, input.farmId)];
      if (input.type) conditions.push(eq(financeTransactions.type, input.type));
      if (input.category) conditions.push(eq(financeTransactions.category, input.category));
      if (input.season) conditions.push(eq(financeTransactions.season, input.season));
      return db.select().from(financeTransactions).where(and(...conditions)).orderBy(desc(financeTransactions.transactionDate));
    }),

  createTransaction: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      type: z.enum(["income", "expense"]),
      category: z.string().min(1).max(64),
      amount: z.string(),
      description: z.string().optional(),
      transactionDate: z.string(),
      season: z.string().optional(),
      referenceNumber: z.string().optional(),
      paymentMethod: z.enum(["cash", "bank_transfer", "mobile_money", "cheque", "other"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const data: any = { ...input, recordedByUserId: ctx.user.id };
      if (data.transactionDate) data.transactionDate = new Date(data.transactionDate);
      const [result] = await db.insert(financeTransactions).values(data);
      return { transactionId: (result as any).insertId };
    }),

  updateTransaction: protectedProcedure
    .input(z.object({
      transactionId: z.number(),
      farmId: z.number(),
      type: z.enum(["income", "expense"]).optional(),
      category: z.string().optional(),
      amount: z.string().optional(),
      description: z.string().optional(),
      transactionDate: z.string().optional(),
      season: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "worker");
      const { transactionId, farmId, ...rawData } = input;
      const data: any = { ...rawData };
      if (data.transactionDate) data.transactionDate = new Date(data.transactionDate);
      await db.update(financeTransactions).set(data).where(and(eq(financeTransactions.id, transactionId), eq(financeTransactions.farmId, farmId)));
      return { success: true };
    }),

  deleteTransaction: protectedProcedure
    .input(z.object({ transactionId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "manager");
      await db.delete(financeTransactions).where(and(eq(financeTransactions.id, input.transactionId), eq(financeTransactions.farmId, input.farmId)));
      return { success: true };
    }),

  // ── Budgets ───────────────────────────────────────────────────────────────────
  listBudgets: protectedProcedure
    .input(z.object({ farmId: z.number(), period: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(budgets.farmId, input.farmId)];
      if (input.period) conditions.push(eq(budgets.period, input.period));
      return db.select().from(budgets).where(and(...conditions)).orderBy(budgets.category);
    }),

  createBudget: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      name: z.string().min(1).max(128),
      category: z.string().min(1).max(64),
      type: z.enum(["income", "expense"]),
      amount: z.string(),
      period: z.string(),
      season: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "manager");
      const [result] = await db.insert(budgets).values({ ...input, createdByUserId: ctx.user.id } as any);
      return { budgetId: (result as any).insertId };
    }),

  deleteBudget: protectedProcedure
    .input(z.object({ budgetId: z.number(), farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await assertFarmMember(input.farmId, ctx.user.id);
      assertMinRole(member, "manager");
      await db.delete(budgets).where(and(eq(budgets.id, input.budgetId), eq(budgets.farmId, input.farmId)));
      return { success: true };
    }),

  // ── P&L Summary ───────────────────────────────────────────────────────────────
  summary: protectedProcedure
    .input(z.object({ farmId: z.number(), season: z.string().optional(), year: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const conditions: any[] = [eq(financeTransactions.farmId, input.farmId)];
      if (input.season) conditions.push(eq(financeTransactions.season, input.season));
      const transactions = await db.select().from(financeTransactions).where(and(...conditions));
      let totalIncome = 0;
      let totalExpense = 0;
      const byCategory: Record<string, { income: number; expense: number }> = {};
      const byMonth: Record<string, { month: string; income: number; expense: number }> = {};
      for (const t of transactions) {
        const amount = parseFloat(String(t.amount)) || 0;
        const month = String(t.transactionDate).slice(0, 7);
        if (!byMonth[month]) byMonth[month] = { month, income: 0, expense: 0 };
        if (!byCategory[t.category]) byCategory[t.category] = { income: 0, expense: 0 };
        if (t.type === "income") {
          totalIncome += amount;
          byMonth[month].income += amount;
          byCategory[t.category].income += amount;
        } else {
          totalExpense += amount;
          byMonth[month].expense += amount;
          byCategory[t.category].expense += amount;
        }
      }
      return {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
        byCategory: Object.entries(byCategory).map(([category, vals]) => ({ category, ...vals })),
      };
    }),

  // ── Budget vs Actual ──────────────────────────────────────────────────────────
  budgetVsActual: protectedProcedure
    .input(z.object({ farmId: z.number(), period: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);
      const budgetList = await db.select().from(budgets).where(and(eq(budgets.farmId, input.farmId), eq(budgets.period, input.period)));
      const transactions = await db.select().from(financeTransactions).where(eq(financeTransactions.farmId, input.farmId));
      const actuals: Record<string, { income: number; expense: number }> = {};
      for (const t of transactions) {
        if (!actuals[t.category]) actuals[t.category] = { income: 0, expense: 0 };
        const amount = parseFloat(String(t.amount)) || 0;
        if (t.type === "income") actuals[t.category].income += amount;
        else actuals[t.category].expense += amount;
      }
      return budgetList.map((b) => ({
        ...b,
        actual: b.type === "income" ? (actuals[b.category]?.income ?? 0) : (actuals[b.category]?.expense ?? 0),
        variance: b.type === "income"
          ? (actuals[b.category]?.income ?? 0) - parseFloat(String(b.amount))
          : parseFloat(String(b.amount)) - (actuals[b.category]?.expense ?? 0),
      }));
    }),

  // ── Dashboard Summary ─────────────────────────────────────────────────────────
  dashboardSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertFarmMember(input.farmId, ctx.user.id);

      const transactions = await db
        .select()
        .from(financeTransactions)
        .where(eq(financeTransactions.farmId, input.farmId))
        .orderBy(desc(financeTransactions.transactionDate));

      let totalIncome = 0;
      let totalExpense = 0;
      const byMonth: Record<string, { month: string; income: number; expense: number }> = {};

      for (const t of transactions) {
        const amount = parseFloat(String(t.amount)) || 0;
        if (t.type === "income") totalIncome += amount;
        else totalExpense += amount;
        const month = String(t.transactionDate).slice(0, 7);
        if (!byMonth[month]) byMonth[month] = { month, income: 0, expense: 0 };
        if (t.type === "income") byMonth[month].income += amount;
        else byMonth[month].expense += amount;
      }

      return {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        recentTransactions: transactions.slice(0, 5).map(t => ({
          id: t.id,
          title: t.description || t.category,
          type: t.type,
          amount: String(t.amount),
          transactionDate: String(t.transactionDate).slice(0, 10),
        })),
        revenueChart: Object.values(byMonth).slice(-6),
      };
    }),
});
