import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter as coreSystemRouter } from "./_core/systemRouter";
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
import { adminRouter } from "./routers/admin";
import { systemRouter } from "./routers/system";
import { subscriptionsRouter } from "./routers/subscriptions";
import { billingRouter } from "./routers/billing";
import { marketplaceRouter } from "./routers/marketplace";
import { workersRouter } from "./routers/workers";

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  organizations: organizationsRouter,
  farms: farmsRouter,
  workers: workersRouter,
  invites: invitesRouter,
  dashboard: dashboardRouter,
  crops: cropsRouter,
  livestock: livestockRouter,
  finance: financeRouter,
  inventory: inventoryRouter,
  disease: diseaseRouter,
  intelligence: intelligenceRouter,
  tasks: tasksRouter,
  weather: weatherRouter,
  iot: iotRouter,
  reminders: remindersRouter,
  notifications: notificationsRouter,
  reports: reportsRouter,
  admin: adminRouter,
  system: systemRouter,
  coreSystem: coreSystemRouter,
  onboarding: onboardingRouter,
  subscriptions: subscriptionsRouter,
  billing: billingRouter,
  marketplace: marketplaceRouter,
});

export type AppRouter = typeof appRouter;
