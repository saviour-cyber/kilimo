import { getDb } from "../../../db";
import { tasks } from "../../../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { IReportProvider, ReportConfiguration, ReportDataBlock } from "../types";
import { format } from "date-fns";

export class TasksReportProvider implements IReportProvider {
  getModuleKey(): string {
    return "tasks";
  }

  async generateDataBlock(config: ReportConfiguration): Promise<ReportDataBlock | null> {
    const db = await getDb();
    if (!db) return null;

    const conditions: any[] = [eq(tasks.farmId, config.farmId)];
    if (config.dateRange?.from) {
      conditions.push(gte(tasks.createdAt, new Date(config.dateRange.from)));
    }
    if (config.dateRange?.to) {
      conditions.push(lte(tasks.createdAt, new Date(config.dateRange.to)));
    }

    const taskList = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    if (taskList.length === 0) return null;

    const rows = taskList.map((t) => ({
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
      due: t.dueDate ? String(t.dueDate) : "—",
      completed: t.completedAt ? format(new Date(t.completedAt), "yyyy-MM-dd") : "—",
    }));

    return {
      title: "Task Summary Report",
      columns: [
        { header: "Task", key: "title", width: 35 },
        { header: "Category", key: "category", width: 18 },
        { header: "Priority", key: "priority", width: 12 },
        { header: "Status", key: "status", width: 15 },
        { header: "Due Date", key: "due", width: 15 },
        { header: "Completed", key: "completed", width: 15 },
      ],
      rows,
    };
  }
}
