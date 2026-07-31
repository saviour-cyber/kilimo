import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { weatherEngine } from "../services/weather";

export const weatherRouter = router({
  getForFarm: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      // The WeatherEngine handles caching, fetching, and event publishing automatically
      return weatherEngine.getWeatherForFarm(input.farmId);
    }),
});
