import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getAIProvider } from "../services/ai";
import { getDb } from "../db";
import { farms, farmModules, tasks, iotSensorState, marketListings } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { weatherEngine } from "../services/weather";

export const intelligenceRouter = router({
  analyzeDisease: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        symptoms: z.string(),
        type: z.enum(["crop", "livestock"]),
      })
    )
    .mutation(async ({ input }) => {
      const provider = getAIProvider();
      return provider.analyzeDisease(input.symptoms, input.type);
    }),

  chat: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        message: z.string(),
        history: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const provider = getAIProvider();
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Gather context
      const [farm] = await db
        .select()
        .from(farms)
        .where(eq(farms.id, input.farmId));

      const enabledModulesDb = await db
        .select()
        .from(farmModules)
        .where(eq(farmModules.farmId, input.farmId));
      
      const activeModules = enabledModulesDb.filter(m => m.isEnabled).map(m => m.moduleKey);

      const recentTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.farmId, input.farmId))
        .orderBy(desc(tasks.createdAt))
        .limit(5);

      const weatherContext = await weatherEngine.getWeatherContextForAI(input.farmId);
      
      const iotStates = await db.select().from(iotSensorState).where(eq(iotSensorState.farmId, input.farmId));
      const iotContext = iotStates.map((s: any) => `Sensor ${s.sensorId}: ${s.latestValue}`).join(', ');

      const activeListings = activeModules.includes("marketplace") 
        ? await db.select().from(marketListings).where(and(eq(marketListings.farmId, input.farmId), eq(marketListings.status, "active")))
        : [];
      const marketplaceContext = activeListings.length > 0
        ? `Active Marketplace Listings: ${activeListings.map(l => `${l.title} (${l.price} ${l.currency})`).join(", ")}`
        : "No active marketplace listings.";

      const contextPrompt = `You are Kili AI, an expert agricultural assistant integrated into SproutX Next.
Current Context:
- Farm Name: ${farm?.name || "Unknown"}
- Farm Type: ${farm?.farmType || "Unknown"}
- Enabled Modules: ${activeModules.join(", ")}
- Recent Tasks: ${recentTasks.map(t => `${t.title} (${t.status})`).join(", ")}
- Live IoT Sensors: ${iotContext || "No active sensors"}
- ${marketplaceContext}

${weatherContext}

Guidelines:
1. Provide concise, actionable advice relevant to agriculture.
2. If the user asks about features they don't have enabled, remind them they can enable the relevant module in Settings.
3. Be helpful, professional, and friendly.`;

      const messages = [
        { role: "system" as const, content: contextPrompt },
        ...input.history,
        { role: "user" as const, content: input.message },
      ];

      return provider.chat(messages);
    }),

  getRecommendations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const provider = getAIProvider();
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Gather context
      const [farm] = await db
        .select()
        .from(farms)
        .where(eq(farms.id, input.farmId));

      const enabledModulesDb = await db
        .select()
        .from(farmModules)
        .where(eq(farmModules.farmId, input.farmId));
      
      const activeModules = enabledModulesDb.filter(m => m.isEnabled).map(m => m.moduleKey);

      const recentTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.farmId, input.farmId))
        .orderBy(desc(tasks.createdAt))
        .limit(10);

      const weatherContext = await weatherEngine.getWeatherContextForAI(input.farmId);

      const iotStates = await db.select().from(iotSensorState).where(eq(iotSensorState.farmId, input.farmId));
      const iotContext = iotStates.map((s: any) => `Sensor ${s.sensorId}: ${s.latestValue}`).join(', ');

      const activeListings = activeModules.includes("marketplace") 
        ? await db.select().from(marketListings).where(and(eq(marketListings.farmId, input.farmId), eq(marketListings.status, "active")))
        : [];
      const marketplaceContext = activeListings.length > 0
        ? `Active Marketplace Listings: ${activeListings.map(l => `${l.title} (${l.price} ${l.currency})`).join(", ")}`
        : "No active marketplace listings.";

      const context = `You are Kili AI, an expert agricultural assistant.
Based on the following data for a farm, generate 3-5 concise, actionable recommendations for the farmer today.
Data:
- Farm Name: ${farm?.name || "Unknown"}
- Farm Type: ${farm?.farmType || "Unknown"}
- Enabled Modules: ${activeModules.join(", ")}
- Recent Tasks: ${recentTasks.map(t => `${t.title} (${t.status})`).join(", ")}
- Live IoT Sensors: ${iotContext || "No active sensors"}
- ${marketplaceContext}
- Pending Tasks: ${recentTasks.filter(t => t.status === "pending").map(t => t.title).join(", ") || "None"}
- Overdue Tasks: ${recentTasks.filter(t => t.status === "pending" && t.dueDate && new Date(String(t.dueDate)) < new Date()).map(t => t.title).join(", ") || "None"}

${weatherContext}`;

      return provider.getDashboardRecommendations(context);
    }),
});
