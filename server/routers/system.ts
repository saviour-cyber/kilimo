import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { platformAnnouncements } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";

export const systemRouter = router({
  getActiveAnnouncements: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select()
      .from(platformAnnouncements)
      .where(eq(platformAnnouncements.isActive, true))
      .orderBy(desc(platformAnnouncements.createdAt))
      .limit(5); // Show latest 5 active announcements
  }),
});
