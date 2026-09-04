import { getDb } from "../../../db";
import { workers, workerAttendance, workerPayroll } from "../../../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { IReportProvider, ReportConfiguration, ReportDataBlock } from "../types";
import { format } from "date-fns";

export class WorkersReportProvider implements IReportProvider {
  getModuleKey(): string {
    return "workers";
  }

  async generateDataBlock(config: ReportConfiguration): Promise<ReportDataBlock | null> {
    const db = await getDb();
    if (!db) return null;

    const reportId = config.filters?.reportId as string | undefined;

    if (reportId === "workers-payroll-export") {
      const conditions: any[] = [eq(workerPayroll.farmId, config.farmId)];
      if (config.dateRange?.from) {
        conditions.push(gte(workerPayroll.periodStart, config.dateRange.from as any));
      }
      if (config.dateRange?.to) {
        conditions.push(lte(workerPayroll.periodEnd, config.dateRange.to as any));
      }

      const payrolls = await db
        .select()
        .from(workerPayroll)
        .where(and(...conditions))
        .orderBy(desc(workerPayroll.periodStart));

      if (payrolls.length === 0) return null;

      const rows = payrolls.map((p) => {
        const formatDate = (d: any) => {
          try { return d ? format(new Date(d), "dd MMM yyyy") : "—"; } catch { return String(d) || "—"; }
        };
        return {
          period: `${formatDate(p.periodStart)} → ${formatDate(p.periodEnd)}`,
          amount: `${p.currency} ${parseFloat(p.amount as string).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`,
          status: p.status,
          paid: formatDate(p.paymentDate),
          notes: p.notes || "—",
        };
      });

      return {
        title: "Worker Payroll Export",
        columns: [
          { header: "Period", key: "period", width: 28 },
          { header: "Amount", key: "amount", width: 22 },
          { header: "Status", key: "status", width: 15 },
          { header: "Payment Date", key: "paid", width: 18 },
          { header: "Notes", key: "notes", width: 30 },
        ],
        rows,
      };
    }

    // Default: Attendance Summary
    const conditions: any[] = [eq(workerAttendance.farmId, config.farmId)];
    if (config.dateRange?.from) {
      conditions.push(gte(workerAttendance.date, config.dateRange.from as any));
    }
    if (config.dateRange?.to) {
      conditions.push(lte(workerAttendance.date, config.dateRange.to as any));
    }

    const attendance = await db
      .select()
      .from(workerAttendance)
      .where(and(...conditions))
      .orderBy(desc(workerAttendance.date));

    if (attendance.length === 0) return null;

    const rows = attendance.map((a) => {
      let dateStr = "—";
      try {
        if (a.date) {
          const d = new Date(a.date as any);
          if (!isNaN(d.getTime())) dateStr = format(d, "dd MMM yyyy");
        }
      } catch {}
      return {
        date: dateStr,
        workerId: a.workerId.toString(),
        status: a.status,
        notes: a.notes || "—",
      };
    });

    return {
      title: "Worker Attendance Summary",
      columns: [
        { header: "Date", key: "date", width: 18 },
        { header: "Worker ID", key: "workerId", width: 15 },
        { header: "Status", key: "status", width: 18 },
        { header: "Notes", key: "notes", width: 35 },
      ],
      rows,
    };
  }
}
