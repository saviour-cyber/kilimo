import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { users, organizations, farms, farmModules, farmMembers } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const onboardingRouter = router({
  setup: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        orgName: z.string(),
        businessType: z.string(),
        country: z.string(),
        county: z.string().optional(),
        currency: z.string(),
        timezone: z.string(),
        farmName: z.string(),
        farmSize: z.number(),
        unit: z.string(),
        modules: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In a real app we'd use a transaction.
      // Drizzle ORM transactions:
      // await db.transaction(async (tx) => { ... })
      
      try {
        // 1. Create Organization
        const [orgResult] = await ctx.db.insert(organizations).values({
          name: input.orgName,
          businessType: input.businessType,
          country: input.country,
          county: input.county,
          currency: input.currency,
          timezone: input.timezone,
          ownerId: input.userId,
        });
        
        const orgId = orgResult.insertId;

        // 2. Create Farm
        const [farmResult] = await ctx.db.insert(farms).values({
          organizationId: orgId,
          name: input.farmName,
          sizeHectares: input.unit === 'Acres' ? (input.farmSize * 0.404686).toString() : input.farmSize.toString(),
          currency: input.currency,
          timezone: input.timezone,
          ownerId: input.userId,
        });

        const farmId = farmResult.insertId;

        // 2b. Add user as farm owner in farmMembers
        await ctx.db.insert(farmMembers).values({
          farmId,
          userId: input.userId,
          farmRole: "owner",
          isActive: true,
        });

        // 3. Enable Modules
        const modulesToInsert = input.modules.map(mod => ({
          farmId,
          moduleKey: mod,
          isEnabled: true,
          enabledByUserId: input.userId,
        }));
        
        if (modulesToInsert.length > 0) {
          await ctx.db.insert(farmModules).values(modulesToInsert);
        }

        return { success: true, orgId, farmId };
      } catch (error) {
        console.error("Onboarding setup failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete onboarding setup",
        });
      }
    }),
});
