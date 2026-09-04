import { getDb } from "../../../db";
import { financeTransactions } from "../../../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { IReportProvider, ReportConfiguration, ReportDataBlock } from "../types";
import { format } from "date-fns";

export class FinanceReportProvider implements IReportProvider {
  getModuleKey(): string {
    return "finance";
  }

  async generateDataBlock(config: ReportConfiguration): Promise<ReportDataBlock | null> {
    const db = await getDb();
    if (!db) return null;

    const conditions: any[] = [eq(financeTransactions.farmId, config.farmId)];
    if (config.dateRange?.from) {
      conditions.push(gte(financeTransactions.transactionDate, new Date(config.dateRange.from)));
    }
    if (config.dateRange?.to) {
      conditions.push(lte(financeTransactions.transactionDate, new Date(config.dateRange.to)));
    }

    const transactions = await db
      .select()
      .from(financeTransactions)
      .where(and(...conditions))
      .orderBy(desc(financeTransactions.transactionDate));

    if (transactions.length === 0) return null;

    let totalIncome = 0;
    let totalExpense = 0;

    const rows = transactions.map((t) => {
      const amount = parseFloat(t.amount as string);
      if (t.type === "income") totalIncome += amount;
      else totalExpense += amount;

      return {
        date: t.transactionDate ? format(new Date(t.transactionDate), "yyyy-MM-dd") : "—",
        type: t.type === "income" ? "Income" : "Expense",
        category: t.category || "—",
        description: t.description || "—",
        amount: `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`,
      };
    });

    // Add summary row
    const net = totalIncome - totalExpense;
    rows.push({
      date: "",
      type: "SUMMARY",
      category: "",
      description: `Total Income: KES ${totalIncome.toLocaleString("en-KE", { minimumFractionDigits: 2 })} | Total Expenses: KES ${totalExpense.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`,
      amount: `Net: KES ${net.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`,
    });

    return {
      title: "Profit & Loss Statement",
      columns: [
        { header: "Date", key: "date", width: 18 },
        { header: "Type", key: "type", width: 12 },
        { header: "Category", key: "category", width: 20 },
        { header: "Description", key: "description", width: 35 },
        { header: "Amount", key: "amount", width: 22 },
      ],
      rows,
    };
  }
}
