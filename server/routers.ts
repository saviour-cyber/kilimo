import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { invitesRouter } from "./routers/invites";
import { remindersRouter } from "./routers/reminders";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { onboardingRouter } from "./routers/onboarding";
import { farmsRouter } from "./routers/farms";
import { cropsRouter } from "./routers/crops";
import { livestockRouter } from "./routers/livestock";
import { inventoryRouter } from "./routers/inventory";
import { financeRouter } from "./routers/finance";
import { tasksRouter } from "./routers/tasks";
import { notificationsRouter } from "./routers/notifications";
import { dashboardRouter } from "./routers/dashboard";
import { weatherRouter } from "./routers/weather";
import { intelligenceRouter } from "./routers/intelligence";
import { diseaseRouter } from "./routers/disease";
import { reportsRouter } from "./routers/reports";
import { iotRouter } from "./routers/iot";
import { usersRouter } from "./routers/users";
import { organizationsRouter } from "./routers/organizations";

export const appRouter = router({
  system: systemRouter,
  invites: invitesRouter,
  reminders: remindersRouter,
  auth: authRouter,
  onboarding: onboardingRouter,
  farms: farmsRouter,
  crops: cropsRouter,
  livestock: livestockRouter,
  inventory: inventoryRouter,
  finance: financeRouter,
  tasks: tasksRouter,
  notifications: notificationsRouter,
  dashboard: dashboardRouter,
  weather: weatherRouter,
  intelligence: intelligenceRouter,
  disease: diseaseRouter,
  reports: reportsRouter,
  iot: iotRouter,
  users: usersRouter,
  organizations: organizationsRouter,
});

export type AppRouter = typeof appRouter;
