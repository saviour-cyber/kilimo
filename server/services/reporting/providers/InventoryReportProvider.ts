import { getDb } from "../../../db";
import { inventoryItems, stockTransactions } from "../../../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { IReportProvider, ReportConfiguration, ReportDataBlock } from "../types";
import { format } from "date-fns";

export class InventoryReportProvider implements IReportProvider {
  getModuleKey(): string {
    return "inventory";
  }

  async generateDataBlock(config: ReportConfiguration): Promise<ReportDataBlock | null> {
    const db = await getDb();
    if (!db) return null;

    // Stock transactions report
    const conditions: any[] = [eq(stockTransactions.farmId, config.farmId)];
    if (config.dateRange?.from) {
      conditions.push(gte(stockTransactions.transactionDate, new Date(config.dateRange.from)));
    }
    if (config.dateRange?.to) {
      conditions.push(lte(stockTransactions.transactionDate, new Date(config.dateRange.to)));
    }

    const transactions = await db
      .select()
      .from(stockTransactions)
      .where(and(...conditions))
      .orderBy(desc(stockTransactions.transactionDate));

    if (transactions.length === 0) {
      // Fall back to current inventory snapshot
      const items = await db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.farmId, config.farmId));

      if (items.length === 0) return null;

      const rows = items.map((i) => ({
        name: i.name,
        category: i.category || "—",
        quantity: `${i.currentStock} ${i.unit || ""}`.trim(),
        minStock: i.minimumStock ? `${i.minimumStock} ${i.unit || ""}`.trim() : "—",
        status: Number(i.currentStock) <= Number(i.minimumStock || 0) ? "⚠ Low Stock" : "OK",
      }));

      return {
        title: "Inventory Stock Report",
        columns: [
          { header: "Item", key: "name", width: 25 },
          { header: "Category", key: "category", width: 20 },
          { header: "Quantity", key: "quantity", width: 18 },
          { header: "Min Stock", key: "minStock", width: 15 },
          { header: "Status", key: "status", width: 15 },
        ],
        rows,
      };
    }

    const rows = transactions.map((t) => ({
      date: t.transactionDate ? format(new Date(t.transactionDate as any), "yyyy-MM-dd") : "—",
      type: t.transactionType,
      item: t.itemId ? `Item #${t.itemId}` : "—",
      quantity: `${t.quantity}`,
      notes: t.reason || "—",
    }));

    return {
      title: "Inventory Transactions Report",
      columns: [
        { header: "Date", key: "date", width: 20 },
        { header: "Type", key: "type", width: 18 },
        { header: "Item", key: "item", width: 25 },
        { header: "Quantity", key: "quantity", width: 18 },
        { header: "Notes", key: "notes", width: 30 },
      ],
      rows,
    };
  }
}
