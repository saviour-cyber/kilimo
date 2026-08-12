# SproutX Next — Project TODO

## Phase 1: Database Schema & Architecture
- [x] Design and write full Drizzle schema (all tables)
- [x] Run migration and apply SQL to database
- [x] Set up all server-side tRPC routers (farms, crops, livestock, inventory, finance, notifications, tasks, settings)

## Phase 2: Core Platform Engine
- [x] Farm context provider (current farm, farm switcher)
- [x] RBAC middleware and permission hooks (Owner, Farm Manager, Worker, Viewer)
- [x] Module registry (register/unregister modules per farm)
- [x] Dynamic sidebar rendering based on active modules and user role
- [x] Farm member management (invite, assign roles)

## Phase 3: Global Layout & Dashboard
- [x] App-wide theme (green/earth palette, Inter font, dark/light)
- [x] SproutXLayout with dynamic sidebar and farm switcher in header
- [x] Dashboard page with KPI cards (active crops, livestock count, pending tasks, revenue)
- [x] Recent activity feed
- [x] Recharts graphs (revenue trend, crop yield, livestock growth)
- [x] Farm onboarding / create first farm flow

## Phase 4: Crop Module
- [x] Field and plot management (create, edit, archive)
- [x] Planting records (crop type, variety, date, field, quantity)
- [x] Growth stage tracking (seedling, vegetative, flowering, harvest)
- [x] Harvest logs (date, yield, quality, notes)
- [x] Crop calendar (timeline view of plantings and harvests)
- [x] Disease and pest incident tracking
- [x] Yield analytics (recharts bar/line charts)

## Phase 5: Livestock Module
- [x] Animal registry (species, breed, tag, DOB, status)
- [x] Breeding records (sire, dam, expected date, outcome)
- [x] Vaccination and health logs
- [x] Feed management (feed type, quantity, schedule)
- [x] Milk production tracking (daily records, trends)
- [x] Egg production tracking
- [x] Mortality records
- [x] Livestock analytics charts

## Phase 6: Inventory Module
- [x] Input inventory (seeds, fertilizers, chemicals, feed)
- [x] Equipment registry and maintenance records
- [x] Stock-in and stock-out transactions
- [x] Low-stock alerts and thresholds
- [x] Supplier records

## Phase 7: Finance Module
- [x] Income and expense transactions
- [x] Transaction categories
- [x] Budget vs. actual reports
- [x] Profit and loss summary per farm season
- [x] Finance charts (recharts area/bar)

## Phase 8: Notifications & Tasks
- [x] In-app notification system (alerts, reminders)
- [x] Task management (create, assign, complete tasks)
- [x] Upcoming task reminders (vaccination, harvest, low-stock)
- [x] Notification bell with unread count in header

## Phase 9: Settings & User Management
- [x] Farm profile editor (name, location, type, logo)
- [x] Team member list and role assignments
- [x] Module enable/disable toggles per farm
- [x] User profile settings

## Phase 10: Polish & Tests
- [x] Vitest unit tests for all routers (15 tests, all passing)
- [x] Empty states for all modules
- [x] Loading skeletons throughout
- [x] Mobile responsiveness check
- [x] Final checkpoint and delivery


## Phase 11: Enhancements — Farm Invitations
- [x] Add farmInvites table to schema (email, token, expiry, status)
- [x] Create invites router with sendInvite, acceptInvite, listInvites, cancelInvite procedures
- [x] Build AcceptInvite page for users to accept farm invitations via token
- [x] Add /accept-invite route to App.tsx
- [x] Email-based invitation flow with 7-day expiry

## Phase 12: Enhancements — Budget vs. Actual Reporting
- [x] Extend finance router with budgetVsActual procedure
- [x] Build BudgetVsActual page with variance analysis
- [x] Add summary cards (budget vs actual income/expense)
- [x] Add variance indicators (over/under budget)
- [x] Add recharts BarChart comparing budget and actual by category
- [x] Add detailed breakdown table with variance per line item
- [x] Integrate into Finance module tabs

## Phase 13: Enhancements — Automated Reminders via Heartbeat
- [x] Create scheduled/generateReminders.ts handler for daily reminder generation
- [x] Implement task due/overdue reminder generation
- [x] Implement harvest-ready crop reminders
- [x] Implement low-stock inventory reminders
- [x] Implement upcoming vaccination reminders
- [x] Register /api/scheduled/generateReminders endpoint in server
- [x] Create reminders router with Heartbeat job management
- [x] Add createDailyReminderJob, listReminderJobs, updateReminderJob, deleteReminderJob procedures
- [x] All 15 vitest tests passing
- [x] Zero TypeScript errors
