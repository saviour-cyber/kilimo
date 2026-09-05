import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  date,
  float,
} from "drizzle-orm/mysql-core";

// â”€â”€â”€ Core Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  password: text("password"),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  isEmailVerified: boolean("isEmailVerified").default(false).notNull(),
  phone: varchar("phone", { length: 32 }),
  country: varchar("country", { length: 64 }).default("Kenya"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  preferredLanguage: varchar("preferredLanguage", { length: 16 }).default("en"),
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("system"),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// â”€â”€â”€ Organizations (Tenants) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  businessType: varchar("businessType", { length: 64 }).notNull(),
  country: varchar("country", { length: 64 }).default("Kenya").notNull(),
  county: varchar("county", { length: 64 }),
  currency: varchar("currency", { length: 8 }).default("KES").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Africa/Nairobi").notNull(),
  logoUrl: text("logoUrl"),
  description: text("description"),
  address: text("address"),
  taxId: varchar("taxId", { length: 64 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// â”€â”€â”€ Organization Members (Pool of Users) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const organizationMembers = mysqlTable("organizationMembers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

// â”€â”€â”€ Farms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const farms = mysqlTable("farms", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  county: varchar("county", { length: 64 }),
  subCounty: varchar("subCounty", { length: 64 }),
  ward: varchar("ward", { length: 64 }),
  location: varchar("location", { length: 256 }),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  farmType: mysqlEnum("farmType", ["crop", "livestock", "mixed", "aquaculture", "poultry", "other"]).default("mixed").notNull(),
  sizeHectares: decimal("sizeHectares", { precision: 10, scale: 2 }),
  logoUrl: text("logoUrl"),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Farm = typeof farms.$inferSelect;
export type InsertFarm = typeof farms.$inferInsert;

// â”€â”€â”€ Farm Members (RBAC) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const farmMembers = mysqlTable("farmMembers", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  userId: int("userId").notNull(),
  farmRole: mysqlEnum("farmRole", ["owner", "administrator", "farm_manager", "worker", "veterinary_officer", "crop_officer", "viewer"]).default("viewer").notNull(),
  invitedByUserId: int("invitedByUserId"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type FarmMember = typeof farmMembers.$inferSelect;
export type InsertFarmMember = typeof farmMembers.$inferInsert;

// â”€â”€â”€ Farm Invitations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const farmInvites = mysqlTable("farmInvites", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  farmRole: mysqlEnum("farmRole", ["owner", "administrator", "farm_manager", "worker", "veterinary_officer", "crop_officer", "viewer"]).default("worker").notNull(),
  invitedByUserId: int("invitedByUserId").notNull(),
  inviteToken: varchar("inviteToken", { length: 128 }).notNull().unique(),
  acceptedByUserId: int("acceptedByUserId"),
  acceptedAt: timestamp("acceptedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FarmInvite = typeof farmInvites.$inferSelect;
export type InsertFarmInvite = typeof farmInvites.$inferInsert;

// â”€â”€â”€ Module Registry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const farmModules = mysqlTable("farmModules", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  moduleKey: varchar("moduleKey", { length: 64 }).notNull(), // e.g. 'crop', 'livestock', 'inventory', 'finance'
  isEnabled: boolean("isEnabled").default(true).notNull(),
  enabledAt: timestamp("enabledAt").defaultNow().notNull(),
  enabledByUserId: int("enabledByUserId"),
});

export type FarmModule = typeof farmModules.$inferSelect;
export type InsertFarmModule = typeof farmModules.$inferInsert;

// â”€â”€â”€ Weather Cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const weatherCache = mysqlTable("weatherCache", {
  id: int("id").autoincrement().primaryKey(),
  latitude: decimal("latitude", { precision: 10, scale: 2 }).notNull(), // rounded to 2 decimal places for grouping
  longitude: decimal("longitude", { precision: 10, scale: 2 }).notNull(),
  dataType: varchar("dataType", { length: 32 }).notNull(), // 'current', 'hourly', 'daily', 'all'
  provider: varchar("provider", { length: 64 }).default("open-meteo").notNull(),
  payload: json("payload").notNull(),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type WeatherCache = typeof weatherCache.$inferSelect;
export type InsertWeatherCache = typeof weatherCache.$inferInsert;

// â”€â”€â”€ Fields / Plots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const fields = mysqlTable("fields", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  sizeHectares: decimal("sizeHectares", { precision: 10, scale: 2 }),
  soilType: varchar("soilType", { length: 64 }),
  location: varchar("location", { length: 256 }),
  notes: text("notes"),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Field = typeof fields.$inferSelect;
export type InsertField = typeof fields.$inferInsert;

// â”€â”€â”€ Crop Plantings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const cropPlantings = mysqlTable("cropPlantings", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  fieldId: int("fieldId"),
  cropName: varchar("cropName", { length: 128 }).notNull(),
  variety: varchar("variety", { length: 128 }),
  plantingDate: date("plantingDate").notNull(),
  expectedHarvestDate: date("expectedHarvestDate"),
  actualHarvestDate: date("actualHarvestDate"),
  quantityPlanted: decimal("quantityPlanted", { precision: 10, scale: 2 }),
  quantityUnit: varchar("quantityUnit", { length: 32 }).default("kg"),
  growthStage: mysqlEnum("growthStage", ["seedling", "vegetative", "flowering", "fruiting", "harvest_ready", "harvested", "failed"]).default("seedling").notNull(),
  status: mysqlEnum("status", ["active", "completed", "failed", "archived"]).default("active").notNull(),
  notes: text("notes"),
  season: varchar("season", { length: 64 }),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CropPlanting = typeof cropPlantings.$inferSelect;
export type InsertCropPlanting = typeof cropPlantings.$inferInsert;

// â”€â”€â”€ Harvest Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const harvestLogs = mysqlTable("harvestLogs", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  plantingId: int("plantingId"),
  fieldId: int("fieldId"),
  cropName: varchar("cropName", { length: 128 }).notNull(),
  harvestDate: date("harvestDate").notNull(),
  yieldAmount: decimal("yieldAmount", { precision: 10, scale: 2 }).notNull(),
  yieldUnit: varchar("yieldUnit", { length: 32 }).default("kg"),
  quality: mysqlEnum("quality", ["excellent", "good", "fair", "poor"]).default("good"),
  soldAmount: decimal("soldAmount", { precision: 10, scale: 2 }),
  pricePerUnit: decimal("pricePerUnit", { precision: 10, scale: 2 }),
  notes: text("notes"),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HarvestLog = typeof harvestLogs.$inferSelect;
export type InsertHarvestLog = typeof harvestLogs.$inferInsert;

// â”€â”€â”€ Disease / Pest Incidents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const cropIncidents = mysqlTable("cropIncidents", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  plantingId: int("plantingId"),
  fieldId: int("fieldId"),
  incidentType: mysqlEnum("incidentType", ["disease", "pest", "weather", "other"]).default("disease").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  detectedDate: date("detectedDate").notNull(),
  resolvedDate: date("resolvedDate"),
  treatment: text("treatment"),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "treated", "resolved", "monitoring"]).default("active").notNull(),
  reportedByUserId: int("reportedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CropIncident = typeof cropIncidents.$inferSelect;
export type InsertCropIncident = typeof cropIncidents.$inferInsert;

// ─── Animal Core Domain: Herds ──────────────────────────────────────────────

export const animalHerds = mysqlTable("animalHerds", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  code: varchar("code", { length: 64 }),
  purpose: mysqlEnum("purpose", [
    "general",
    "milking",
    "dry",
    "calves",
    "heifers",
    "fattening",
    "quarantine",
    "pasture_group"
  ]).default("general").notNull(),
  location: varchar("location", { length: 255 }),
  targetHeadCount: int("targetHeadCount"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnimalHerd = typeof animalHerds.$inferSelect;
export type InsertAnimalHerd = typeof animalHerds.$inferInsert;

// ─── Animals (Canonical Animal Core Entity) ──────────────────────────────────

export const animals = mysqlTable("animals", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  tagNumber: varchar("tagNumber", { length: 64 }),
  name: varchar("name", { length: 128 }),
  species: varchar("species", { length: 64 }).notNull(), // cattle, goat, sheep, pig, etc.
  breed: varchar("breed", { length: 128 }),
  gender: mysqlEnum("gender", ["male", "female", "unknown"]).default("unknown").notNull(),
  dateOfBirth: date("dateOfBirth"),
  acquisitionDate: date("acquisitionDate"),
  acquisitionType: mysqlEnum("acquisitionType", ["born", "purchased", "donated", "other"]).default("born"),
  status: mysqlEnum("status", ["active", "sold", "deceased", "transferred"]).default("active").notNull(),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  weightUnit: varchar("weightUnit", { length: 16 }).default("kg"),
  notes: text("notes"),
  parentMaleId: int("parentMaleId"),
  parentFemaleId: int("parentFemaleId"),
  
  // Extension & Intelligence attributes
  isDairy: boolean("isDairy").default(false).notNull(),
  herdId: int("herdId"),
  bodyConditionScore: decimal("bodyConditionScore", { precision: 3, scale: 1 }), // 1.0 - 5.0
  currentLocation: varchar("currentLocation", { length: 128 }),
  lactationStage: mysqlEnum("lactationStage", ["non_lactating", "early", "mid", "late", "dry"]).default("non_lactating").notNull(),
  
  // Quarantine status
  isQuarantined: boolean("isQuarantined").default(false).notNull(),
  quarantineReason: varchar("quarantineReason", { length: 255 }),
  quarantineUntil: date("quarantineUntil"),

  // Commercial / Purchase & Sales valuation
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 2 }),
  purchaseDate: date("purchaseDate"),
  sellerInfo: varchar("sellerInfo", { length: 255 }),
  salePrice: decimal("salePrice", { precision: 10, scale: 2 }),
  saleDate: date("saleDate"),
  buyerInfo: varchar("buyerInfo", { length: 255 }),
  saleWeight: decimal("saleWeight", { precision: 8, scale: 2 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = typeof animals.$inferInsert;

// ─── Heat Detection & Estrus Tracking ────────────────────────────────────────

export const animalHeatLogs = mysqlTable("animalHeatLogs", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId").notNull(),
  observedDate: date("observedDate").notNull(),
  observedTime: varchar("observedTime", { length: 16 }),
  heatSigns: text("heatSigns").notNull(), // standing heat, clear mucus, mounting, restlessness
  intensity: mysqlEnum("intensity", ["weak", "moderate", "strong"]).default("moderate").notNull(),
  breedingWindowStart: timestamp("breedingWindowStart"),
  breedingWindowEnd: timestamp("breedingWindowEnd"),
  status: mysqlEnum("status", ["observed", "inseminated", "expired", "missed"]).default("observed").notNull(),
  notes: text("notes"),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnimalHeatLog = typeof animalHeatLogs.$inferSelect;
export type InsertAnimalHeatLog = typeof animalHeatLogs.$inferInsert;

// ─── Breeding & Gestation Tracking ───────────────────────────────────────────

export const breedingRecords = mysqlTable("breedingRecords", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  damId: int("damId").notNull(), // mother
  sireId: int("sireId"), // father (may be external)
  sireDescription: varchar("sireDescription", { length: 128 }),
  breedingDate: date("breedingDate").notNull(),
  breedingMethod: mysqlEnum("breedingMethod", ["natural", "artificial_insemination", "embryo_transfer"]).default("natural").notNull(),
  gestationDays: int("gestationDays").default(283).notNull(),
  pregnancyStatus: mysqlEnum("pregnancyStatus", ["pending", "confirmed", "open", "delivered", "failed"]).default("pending").notNull(),
  confirmedDate: date("confirmedDate"),
  expectedDeliveryDate: date("expectedDeliveryDate"),
  dryOffDate: date("dryOffDate"), // Recommended dry-off date (e.g., 60 days before delivery)
  actualDeliveryDate: date("actualDeliveryDate"),
  offspringCount: int("offspringCount"),
  outcome: mysqlEnum("outcome", ["pending", "successful", "failed", "aborted"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BreedingRecord = typeof breedingRecords.$inferSelect;
export type InsertBreedingRecord = typeof breedingRecords.$inferInsert;

// ─── Animal Movements / Pasture & Pen Transfers ──────────────────────────────

export const animalMovements = mysqlTable("animalMovements", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId").notNull(),
  fromLocation: varchar("fromLocation", { length: 128 }),
  toLocation: varchar("toLocation", { length: 128 }).notNull(),
  fromHerdId: int("fromHerdId"),
  toHerdId: int("toHerdId"),
  movementDate: date("movementDate").notNull(),
  reason: mysqlEnum("reason", [
    "pasture_rotation",
    "quarantine",
    "weaning",
    "maternity",
    "treatment",
    "housing_change",
    "sale",
    "other"
  ]).default("pasture_rotation").notNull(),
  notes: text("notes"),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnimalMovement = typeof animalMovements.$inferSelect;
export type InsertAnimalMovement = typeof animalMovements.$inferInsert;

// ─── Vaccination / Health Logs with Drug Withdrawal ──────────────────────────

export const healthLogs = mysqlTable("healthLogs", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId"),
  logType: mysqlEnum("logType", ["vaccination", "treatment", "checkup", "surgery", "weight", "other"]).default("checkup").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description"),
  performedDate: date("performedDate").notNull(),
  nextDueDate: date("nextDueDate"),
  performedBy: varchar("performedBy", { length: 128 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  
  // Advanced Health Intelligence
  bcsScore: decimal("bcsScore", { precision: 3, scale: 1 }), // Body Condition Score
  meatWithdrawalDays: int("meatWithdrawalDays").default(0),
  meatWithdrawalEndDate: date("meatWithdrawalEndDate"),
  milkWithdrawalDays: int("milkWithdrawalDays").default(0),
  milkWithdrawalEndDate: date("milkWithdrawalEndDate"),
  isQuarantineRecommended: boolean("isQuarantineRecommended").default(false).notNull(),

  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HealthLog = typeof healthLogs.$inferSelect;
export type InsertHealthLog = typeof healthLogs.$inferInsert;

// â”€â”€â”€ Feed Records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const feedRecords = mysqlTable("feedRecords", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId"),
  feedType: varchar("feedType", { length: 128 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).default("kg"),
  feedDate: date("feedDate").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedRecord = typeof feedRecords.$inferSelect;
export type InsertFeedRecord = typeof feedRecords.$inferInsert;

// â”€â”€â”€ Production Records (Milk, Eggs) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const productionRecords = mysqlTable("productionRecords", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId"),
  productType: mysqlEnum("productType", ["milk", "eggs", "wool", "honey", "other"]).default("milk").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).default("liters"),
  recordDate: date("recordDate").notNull(),
  quality: mysqlEnum("quality", ["excellent", "good", "fair", "poor"]).default("good"),
  notes: text("notes"),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductionRecord = typeof productionRecords.$inferSelect;
export type InsertProductionRecord = typeof productionRecords.$inferInsert;

// â”€â”€â”€ Mortality Records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const mortalityRecords = mysqlTable("mortalityRecords", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId").notNull(),
  deathDate: date("deathDate").notNull(),
  cause: varchar("cause", { length: 256 }),
  causeCategory: mysqlEnum("causeCategory", ["disease", "injury", "natural", "predator", "unknown", "other"]).default("unknown").notNull(),
  notes: text("notes"),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MortalityRecord = typeof mortalityRecords.$inferSelect;
export type InsertMortalityRecord = typeof mortalityRecords.$inferInsert;

// â”€â”€â”€ Inventory Items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const inventoryItems = mysqlTable("inventoryItems", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["seed", "fertilizer", "chemical", "feed", "equipment", "fuel", "packaging", "other"]).default("other").notNull(),
  sku: varchar("sku", { length: 64 }),
  unit: varchar("unit", { length: 32 }).default("kg"),
  currentStock: decimal("currentStock", { precision: 10, scale: 2 }).default("0").notNull(),
  minimumStock: decimal("minimumStock", { precision: 10, scale: 2 }).default("0"),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }),
  supplierId: int("supplierId"),
  notes: text("notes"),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

// â”€â”€â”€ Stock Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const stockTransactions = mysqlTable("stockTransactions", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  itemId: int("itemId").notNull(),
  transactionType: mysqlEnum("transactionType", ["stock_in", "stock_out", "adjustment"]).default("stock_in").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }),
  reason: varchar("reason", { length: 256 }),
  referenceNumber: varchar("referenceNumber", { length: 64 }),
  transactionDate: date("transactionDate").notNull(),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockTransaction = typeof stockTransactions.$inferSelect;
export type InsertStockTransaction = typeof stockTransactions.$inferInsert;

// â”€â”€â”€ Suppliers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  contactName: varchar("contactName", { length: 128 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  notes: text("notes"),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// â”€â”€â”€ Equipment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const equipment = mysqlTable("equipment", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }),
  serialNumber: varchar("serialNumber", { length: 128 }),
  purchaseDate: date("purchaseDate"),
  purchaseCost: decimal("purchaseCost", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["operational", "maintenance", "repair", "retired"]).default("operational").notNull(),
  lastMaintenanceDate: date("lastMaintenanceDate"),
  nextMaintenanceDate: date("nextMaintenanceDate"),
  notes: text("notes"),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

// â”€â”€â”€ Finance Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const financeTransactions = mysqlTable("financeTransactions", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 256 }),
  transactionDate: date("transactionDate").notNull(),
  season: varchar("season", { length: 64 }),
  referenceNumber: varchar("referenceNumber", { length: 64 }),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "bank_transfer", "mobile_money", "cheque", "other"]).default("cash"),
  notes: text("notes"),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type InsertFinanceTransaction = typeof financeTransactions.$inferInsert;

// â”€â”€â”€ Budgets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  period: varchar("period", { length: 32 }).notNull(), // e.g. "2024-Q1", "2024", "2024-01"
  season: varchar("season", { length: 64 }),
  notes: text("notes"),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

// â”€â”€â”€ Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["crop", "livestock", "inventory", "finance", "maintenance", "general"]).default("general").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  dueDate: date("dueDate"),
  completedAt: timestamp("completedAt"),
  assignedToUserId: int("assignedToUserId"),
  assignedToWorkerId: int("assignedToWorkerId"),
  createdByUserId: int("createdByUserId"),
  relatedEntityType: varchar("relatedEntityType", { length: 64 }), // 'animal', 'planting', 'equipment', etc.
  relatedEntityId: int("relatedEntityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// â”€â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message"),
  type: mysqlEnum("type", ["info", "warning", "alert", "success"]).default("info").notNull(),
  category: mysqlEnum("category", ["task", "crop", "livestock", "inventory", "finance", "system"]).default("system").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedEntityType: varchar("relatedEntityType", { length: 64 }),
  relatedEntityId: int("relatedEntityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// â”€â”€â”€ Platform Email Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const platformEmailLogs = mysqlTable("platformEmailLogs", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId"), // Nullable for automated system emails
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  templateKey: varchar("templateKey", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "failed"]).default("queued").notNull(),
  providerMessageId: varchar("providerMessageId", { length: 128 }),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
  failedAt: timestamp("failedAt"),
});

export type PlatformEmailLog = typeof platformEmailLogs.$inferSelect;
export type InsertPlatformEmailLog = typeof platformEmailLogs.$inferInsert;

// â”€â”€â”€ Disease Scans (AI Detections) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const diseaseScans = mysqlTable("diseaseScans", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  scanType: mysqlEnum("scanType", ["crop", "livestock", "other"]).default("crop").notNull(),
  imageUrl: text("imageUrl").notNull(),
  detectedDisease: varchar("detectedDisease", { length: 256 }),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }), // e.g. 98.50
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical", "unknown"]).default("unknown").notNull(),
  recommendation: text("recommendation"),
  status: mysqlEnum("status", ["pending_review", "verified", "false_positive", "treated"]).default("pending_review").notNull(),
  relatedEntityId: int("relatedEntityId"), // Optional link to animalId or plantingId depending on scanType
  notes: text("notes"),
  scannedByUserId: int("scannedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiseaseScan = typeof diseaseScans.$inferSelect;
export type InsertDiseaseScan = typeof diseaseScans.$inferInsert;

// â”€â”€â”€ Generated Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generatedReports = mysqlTable("generatedReports", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  moduleKeys: json("moduleKeys").notNull(),
  filters: json("filters"),
  format: mysqlEnum("format", ["pdf", "excel", "csv", "print"]).notNull(),
  fileUrl: text("fileUrl"),
  generatedByUserId: int("generatedByUserId").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
});

export type GeneratedReport = typeof generatedReports.$inferSelect;
export type InsertGeneratedReport = typeof generatedReports.$inferInsert;

// â”€â”€â”€ Scheduled Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const scheduledReports = mysqlTable("scheduledReports", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  moduleKeys: json("moduleKeys").notNull(),
  filters: json("filters"),
  format: mysqlEnum("format", ["pdf", "excel", "csv"]).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).notNull(),
  nextRunAt: timestamp("nextRunAt").notNull(),
  lastRunAt: timestamp("lastRunAt"),
  createdByUserId: int("createdByUserId").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;

// â”€â”€â”€ IoT Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotDevices = mysqlTable("iotDevices", {
  id:                  int("id").autoincrement().primaryKey(),
  farmId:              int("farmId").notNull(),
  name:                varchar("name", { length: 128 }).notNull(),
  deviceType:          mysqlEnum("deviceType", [
    "weather_station", "soil_probe", "water_sensor",
    "livestock_collar", "equipment_sensor", "gateway", "other"
  ]).notNull(),
  protocol:            mysqlEnum("protocol", ["simulated", "mqtt", "http", "lorawan", "zigbee", "ble"]).default("simulated").notNull(),
  manufacturer:        varchar("manufacturer", { length: 128 }),
  model:               varchar("model", { length: 128 }),
  firmwareVersion:     varchar("firmwareVersion", { length: 64 }),
  status:              mysqlEnum("status", ["online", "offline", "error", "maintenance"]).default("offline").notNull(),
  batteryLevel:        int("batteryLevel"),      // 0-100 percent
  location:            json("location"),         // { lat, lng, label }
  lastCommunicationAt: timestamp("lastCommunicationAt"),
  isSimulated:         boolean("isSimulated").default(true).notNull(),
  // Phase 5: structural links
  gatewayId:           int("gatewayId"),         // FK â†’ iotGateways.id
  groupId:             int("groupId"),            // FK â†’ iotDeviceGroups.id
  twinId:              int("twinId"),             // FK â†’ iotDigitalTwins.id
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IotDevice = typeof iotDevices.$inferSelect;
export type InsertIotDevice = typeof iotDevices.$inferInsert;

// â”€â”€â”€ IoT Sensors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotSensors = mysqlTable("iotSensors", {
  id:           int("id").autoincrement().primaryKey(),
  deviceId:     int("deviceId").notNull(),
  farmId:       int("farmId").notNull(),
  sensorType:   mysqlEnum("sensorType", [
    // Soil
    "soil_moisture", "soil_temperature", "soil_ph", "soil_ec",
    // Environmental
    "air_temperature", "humidity", "rainfall", "wind_speed", "solar_radiation",
    // Water
    "tank_level", "water_flow", "irrigation_pressure", "water_level",
    // Livestock
    "livestock_temperature", "activity", "gps_location", "feed_intake",
    // Equipment
    "fuel_level", "engine_hours", "battery_voltage", "maintenance_status",
    // Generic
    "other"
  ]).notNull(),
  category:     mysqlEnum("category", ["soil", "environmental", "water", "livestock", "equipment"]).notNull(),
  label:        varchar("label", { length: 128 }),     // e.g. "Field A Soil Probe 1"
  unit:         varchar("unit", { length: 32 }),       // e.g. "%", "Â°C", "L/h"
  minVal:     float("minVal"),
  maxVal:     float("maxVal"),
  alertMin:   float("alertMin"),                    // threshold: notify if below
  alertMax:   float("alertMax"),                    // threshold: notify if above
  isActive:     boolean("isActive").default(true).notNull(),
  // Phase 5: calibration fields
  calibrationOffset:     float("calibrationOffset").default(0),      // added to raw value
  calibrationMultiplier: float("calibrationMultiplier").default(1),  // multiplied after offset
  calibrationMethod:     varchar("calibrationMethod", { length: 64 }),// e.g. 'manual', 'factory', 'auto'
  calibrationStatus:     mysqlEnum("calibrationStatus", ["ok", "due", "overdue", "uncalibrated"]).default("uncalibrated"),
  lastCalibratedAt:      timestamp("lastCalibratedAt"),
  nextCalibrationAt:     timestamp("nextCalibrationAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export type IotSensor = typeof iotSensors.$inferSelect;
export type InsertIotSensor = typeof iotSensors.$inferInsert;

// â”€â”€â”€ IoT Telemetry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotTelemetry = mysqlTable("iotTelemetry", {
  id:          int("id").autoincrement().primaryKey(),
  sensorId:    int("sensorId").notNull(),
  deviceId:    int("deviceId").notNull(),
  farmId:      int("farmId").notNull(),
  value:       float("value").notNull(),
  metadata:    json("metadata"),                      // e.g. { lat, lng } for GPS
  recordedAt:  timestamp("recordedAt").defaultNow().notNull(),
});

export type IotTelemetry = typeof iotTelemetry.$inferSelect;
export type InsertIotTelemetry = typeof iotTelemetry.$inferInsert;

// â”€â”€â”€ IoT Alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotAlerts = mysqlTable("iotAlerts", {
  id:          int("id").autoincrement().primaryKey(),
  farmId:      int("farmId").notNull(),
  ruleId:      int("ruleId"),
  sensorId:    int("sensorId").notNull(),
  deviceId:    int("deviceId").notNull(),
  alertType:   mysqlEnum("alertType", ["threshold_high", "threshold_low", "device_offline", "battery_low"]).notNull(),
  message:     text("message").notNull(),
  value:       float("value"),
  isRead:      boolean("isRead").default(false).notNull(),
  resolvedAt:  timestamp("resolvedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type IotAlert = typeof iotAlerts.$inferSelect;
export type InsertIotAlert = typeof iotAlerts.$inferInsert;

// â”€â”€â”€ IoT Sensor State (Current) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotSensorState = mysqlTable("iotSensorState", {
  id:               int("id").autoincrement().primaryKey(),
  sensorId:         int("sensorId").notNull().unique(),
  deviceId:         int("deviceId").notNull(),
  farmId:           int("farmId").notNull(),
  latestValue:      float("latestValue"),
  latestRecordedAt: timestamp("latestRecordedAt"),
  signalStrength:   int("signalStrength"),
  batteryLevel:     int("batteryLevel"),
  healthScore:      int("healthScore"),
  lastAlertId:      int("lastAlertId"),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IotSensorState = typeof iotSensorState.$inferSelect;
export type InsertIotSensorState = typeof iotSensorState.$inferInsert;

// â”€â”€â”€ IoT Alert Rules (Rules Engine) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotAlertRules = mysqlTable("iotAlertRules", {
  id:                   int("id").autoincrement().primaryKey(),
  farmId:               int("farmId").notNull(),
  name:                 varchar("name", { length: 128 }).notNull(),
  description:          text("description"),
  sensorId:             int("sensorId"),                        // if null, applies to all sensors of sensorType
  sensorType:           varchar("sensorType", { length: 64 }),  // if null, applies to specific sensorId
  condition:            mysqlEnum("condition", [">", "<", ">=", "<=", "==", "!="]).notNull(),
  threshold:            float("threshold").notNull(),
  comparisonValue:      varchar("comparisonValue", { length: 64 }), // e.g. for string-based states if ever needed
  severity:             mysqlEnum("severity", ["info", "warning", "critical"]).default("warning").notNull(),
  priority:             int("priority").default(0).notNull(),       // higher number = higher priority
  enabled:              boolean("enabled").default(true).notNull(),
  evaluationWindow:     int("evaluationWindow"),                    // minutes (e.g. sustained over 5 mins)
  cooldownPeriod:       int("cooldownPeriod").default(60).notNull(), // minutes before triggering again
  messageTemplate:      text("messageTemplate").notNull(),
  notificationChannels: json("notificationChannels"),                 // e.g. ['in_app', 'email', 'sms']
  actionType:           mysqlEnum("actionType", ["notify", "task", "webhook", "recommendation"]).default("notify").notNull(),
  webhookUrl:           varchar("webhookUrl", { length: 512 }),
  targetModule:         varchar("targetModule", { length: 64 }),    // e.g. 'irrigation'
  createdBy:            int("createdBy").notNull(),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IotAlertRule = typeof iotAlertRules.$inferSelect;
export type InsertIotAlertRule = typeof iotAlertRules.$inferInsert;

// â”€â”€â”€ IoT Gateways â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotGateways = mysqlTable("iotGateways", {
  id:           int("id").autoincrement().primaryKey(),
  farmId:       int("farmId").notNull(),
  name:         varchar("name", { length: 128 }).notNull(),
  protocol:     mysqlEnum("protocol", ["mqtt", "lorawan", "zigbee", "ble", "http", "simulated"]).default("mqtt").notNull(),
  externalId:   varchar("externalId", { length: 128 }),  // gateway's own identifier
  status:       mysqlEnum("status", ["online", "offline", "error"]).default("offline").notNull(),
  config:       json("config"),                           // protocol-specific connection config
  lastSeenAt:   timestamp("lastSeenAt"),
  ipAddress:    varchar("ipAddress", { length: 64 }),
  firmwareVersion: varchar("firmwareVersion", { length: 64 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IotGateway = typeof iotGateways.$inferSelect;
export type InsertIotGateway = typeof iotGateways.$inferInsert;

// â”€â”€â”€ IoT Device Groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotDeviceGroups = mysqlTable("iotDeviceGroups", {
  id:          int("id").autoincrement().primaryKey(),
  farmId:      int("farmId").notNull(),
  name:        varchar("name", { length: 128 }).notNull(),    // e.g. "North Field", "Dairy Unit"
  description: text("description"),
  color:       varchar("color", { length: 16 }),              // UI color tag
  createdBy:   int("createdBy").notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IotDeviceGroup = typeof iotDeviceGroups.$inferSelect;
export type InsertIotDeviceGroup = typeof iotDeviceGroups.$inferInsert;

export const iotDeviceGroupMembers = mysqlTable("iotDeviceGroupMembers", {
  id:       int("id").autoincrement().primaryKey(),
  groupId:  int("groupId").notNull(),
  deviceId: int("deviceId").notNull(),
  addedAt:  timestamp("addedAt").defaultNow().notNull(),
});

export type IotDeviceGroupMember = typeof iotDeviceGroupMembers.$inferSelect;
export type InsertIotDeviceGroupMember = typeof iotDeviceGroupMembers.$inferInsert;

// â”€â”€â”€ IoT Digital Twins â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotDigitalTwins = mysqlTable("iotDigitalTwins", {
  id:           int("id").autoincrement().primaryKey(),
  farmId:       int("farmId").notNull(),
  label:        varchar("label", { length: 128 }).notNull(),  // e.g. "Field A", "Greenhouse 1"
  entityType:   mysqlEnum("entityType", [
    "field", "paddock", "greenhouse", "livestock_shed",
    "water_tank", "irrigation_zone", "equipment_yard", "other"
  ]).notNull(),
  entityId:     int("entityId"),                              // FK to the related business entity (fieldId, etc.)
  location:     json("location"),                             // { lat, lng, polygon }
  description:  text("description"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IotDigitalTwin = typeof iotDigitalTwins.$inferSelect;
export type InsertIotDigitalTwin = typeof iotDigitalTwins.$inferInsert;

// â”€â”€â”€ IoT Commands â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotCommands = mysqlTable("iotCommands", {
  id:          int("id").autoincrement().primaryKey(),
  farmId:      int("farmId").notNull(),
  deviceId:    int("deviceId").notNull(),
  issuedBy:    int("issuedBy").notNull(),                     // userId
  commandType: mysqlEnum("commandType", [
    "irrigation_on", "irrigation_off",
    "valve_open", "valve_close",
    "device_restart", "sensor_calibrate",
    "request_telemetry", "firmware_update",
    "set_reporting_interval"
  ]).notNull(),
  params:      json("params"),                                // e.g. { interval: 60, duration: 300 }
  status:      mysqlEnum("status", ["pending", "sent", "acknowledged", "completed", "failed"]).default("pending").notNull(),
  result:      text("result"),                               // response from device or error message
  sentAt:      timestamp("sentAt"),
  completedAt: timestamp("completedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type IotCommand = typeof iotCommands.$inferSelect;
export type InsertIotCommand = typeof iotCommands.$inferInsert;

// â”€â”€â”€ IoT Event History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotEvents = mysqlTable("iotEvents", {
  id:          int("id").autoincrement().primaryKey(),
  farmId:      int("farmId").notNull(),
  deviceId:    int("deviceId"),
  sensorId:    int("sensorId"),
  gatewayId:   int("gatewayId"),
  eventType:   varchar("eventType", { length: 64 }).notNull(), // mirrors IOT_EVENTS constants
  source:      varchar("source", { length: 64 }).notNull(),    // e.g. 'device_monitor', 'alert_engine'
  payload:     json("payload"),                                // event-specific data
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type IotEvent = typeof iotEvents.$inferSelect;
export type InsertIotEvent = typeof iotEvents.$inferInsert;

// â”€â”€â”€ IoT Sensor Calibration Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const iotSensorCalibrationLog = mysqlTable("iotSensorCalibrationLog", {
  id:                int("id").autoincrement().primaryKey(),
  sensorId:          int("sensorId").notNull(),
  farmId:            int("farmId").notNull(),
  calibratedBy:      int("calibratedBy").notNull(),            // userId
  method:            varchar("method", { length: 64 }).notNull(), // 'manual', 'factory', 'auto'
  offsetBefore:      float("offsetBefore"),
  multiplierBefore:  float("multiplierBefore"),
  offsetAfter:       float("offsetAfter").notNull(),
  multiplierAfter:   float("multiplierAfter").notNull(),
  notes:             text("notes"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
});

export type IotSensorCalibrationLog = typeof iotSensorCalibrationLog.$inferSelect;
export type InsertIotSensorCalibrationLog = typeof iotSensorCalibrationLog.$inferInsert;


// â”€â”€â”€ Email Verification Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Stores single-use tokens sent to users for email verification after registration.
// Each token is hashed (SHA-256) before storage; only the hash is persisted.

export const emailVerificationTokens = mysqlTable("emailVerificationTokens", {
  id:        int("id").autoincrement().primaryKey(),
  userId:    int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).unique().notNull(), // SHA-256 hex
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt:    timestamp("usedAt"),                                      // null = not yet used
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;

// â”€â”€â”€ Password Reset Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Stores single-use tokens for password reset flows.
// Tokens expire in 30 minutes and are invalidated immediately after use.

export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id:        int("id").autoincrement().primaryKey(),
  userId:    int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).unique().notNull(), // SHA-256 hex
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt:    timestamp("usedAt"),                                      // null = not yet used
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
// â”€â”€â”€ Platform Administration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const platformModules = mysqlTable("platformModules", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  version: varchar("version", { length: 32 }).default("1.0.0"),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  icon: varchar("icon", { length: 64 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const platformServices = mysqlTable("platformServices", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  providerConfig: json("providerConfig"), // To store API keys, selected models, etc
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable("activitylogs", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull().default(0),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: int("entityId"),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Type aliases â€“ auditLogs is the canonical activity log table (SQL: activitylogs)
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
// Keep backward-compat aliases for any code that imported ActivityLog
export type ActivityLog = AuditLog;
export type InsertActivityLog = InsertAuditLog;


export const platformAnnouncements = mysqlTable("platformannouncements", {
  id: varchar("id", { length: 64 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 32 }).notNull().default("info"), // 'info', 'warning', 'critical', 'feature'
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// â”€â”€â”€ Subscription Domain â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
// Organization (1) â”€â”€â–¶ Subscription (1) â”€â”€â–¶ Plan (N)
//                                        â”€â”€â–¶ PlanFeatures (N)
//                   â”€â”€â–¶ Payments (N)
//
// The subscription belongs to the Organization, not to an individual user.
// Plans define what modules/services are included and what usage limits apply.
// Payments are recorded provider-agnostically; provider key is stored per row.

// â”€â”€â”€ Subscription Plans â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id:           int("id").autoincrement().primaryKey(),
  name:         varchar("name", { length: 64 }).notNull(),          // "Free", "Starter", "Professional", "Enterprise"
  description:  text("description"),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull().default("0"),
  yearlyPrice:  decimal("yearlyPrice",  { precision: 10, scale: 2 }).notNull().default("0"),
  currency:     varchar("currency", { length: 8 }).notNull().default("KES"),
  trialDays:    int("trialDays").default(14).notNull(),
  // Usage limits â€” NULL means unlimited
  maxFarms:     int("maxFarms"),
  maxUsers:     int("maxUsers"),
  maxDevices:   int("maxDevices"),
  maxStorageMb: int("maxStorageMb"),
  isActive:     boolean("isActive").default(true).notNull(),
  isRecommended: boolean("isRecommended").default(false).notNull(),
  isDefaultTrial: boolean("isDefaultTrial").default(false).notNull(),
  sortOrder:    int("sortOrder").default(0).notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// â”€â”€â”€ Subscription Plan Features (Entitlements) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const subscriptionPlanFeatures = mysqlTable("subscriptionPlanFeatures", {
  id:          int("id").autoincrement().primaryKey(),
  planId:      int("planId").notNull(),                              // FK â†’ subscriptionPlans.id
  featureKey:  varchar("featureKey", { length: 64 }).notNull(),     // maps to MODULE_REGISTRY or SERVICE_REGISTRY key
  featureType: mysqlEnum("featureType", ["module", "service"]).notNull().default("module"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPlanFeature = typeof subscriptionPlanFeatures.$inferSelect;
export type InsertSubscriptionPlanFeature = typeof subscriptionPlanFeatures.$inferInsert;

// â”€â”€â”€ Subscriptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const subscriptions = mysqlTable("subscriptions", {
  id:                 int("id").autoincrement().primaryKey(),
  organizationId:     int("organizationId").notNull().unique(),       // FK â†’ organizations.id (1 active sub per org)
  planId:             int("planId").notNull(),                        // FK â†’ subscriptionPlans.id
  status:             mysqlEnum("status", [
    "trialing",
    "active",
    "past_due",
    "cancelled",
    "expired",
    "suspended",
  ]).notNull().default("trialing"),
  billingInterval:    mysqlEnum("billingInterval", ["monthly", "yearly", "lifetime"]).notNull().default("monthly"),
  trialEndsAt:        timestamp("trialEndsAt"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd:   timestamp("currentPeriodEnd"),
  cancelledAt:        timestamp("cancelledAt"),
  cancelReason:       text("cancelReason"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// â”€â”€â”€ Subscription Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const subscriptionPayments = mysqlTable("subscriptionPayments", {
  id:                    int("id").autoincrement().primaryKey(),
  subscriptionId:        int("subscriptionId").notNull(),             // FK â†’ subscriptions.id
  organizationId:        int("organizationId").notNull(),             // FK â†’ organizations.id (denormalized for fast queries)
  amount:                decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency:              varchar("currency", { length: 8 }).notNull().default("KES"),
  status:                mysqlEnum("status", ["pending", "successful", "failed", "refunded"]).notNull().default("pending"),
  billingInterval:       mysqlEnum("billingInterval", ["monthly", "yearly"]).notNull().default("monthly"),
  paymentProvider:       varchar("paymentProvider", { length: 64 }),  // "pesapal", "stripe", "manual"
  providerTransactionId: varchar("providerTransactionId", { length: 128 }),
  periodStart:           timestamp("periodStart"),
  periodEnd:             timestamp("periodEnd"),
  paidAt:                timestamp("paidAt"),
  failureReason:         text("failureReason"),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type InsertSubscriptionPayment = typeof subscriptionPayments.$inferInsert;

// â”€â”€â”€ Marketplace â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
// Marketplace is a Farm Module gated by the subscription entitlement system.
// A listing belongs to an Organization and optionally identifies the originating Farm.
// Images are stored via the Forge/S3 storage service â€” never as binary in MySQL.
//
// Flow:
//   subscriptionPlanFeatures (featureKey="marketplace")
//     â†’ farmModules (moduleKey="marketplace", isEnabled=true)
//       â†’ MarketListing (organizationId, farmId)
//         â†’ MarketListingImages (storageKey)

// â”€â”€â”€ Market Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const marketCategories = mysqlTable("marketCategories", {
  id:          int("id").autoincrement().primaryKey(),
  name:        varchar("name", { length: 64 }).notNull(),
  slug:        varchar("slug", { length: 64 }).notNull().unique(),       // e.g. "crops", "livestock"
  description: text("description"),
  iconName:    varchar("iconName", { length: 64 }),                      // Lucide icon name
  sortOrder:   int("sortOrder").default(0).notNull(),
  isActive:    boolean("isActive").default(true).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketCategory = typeof marketCategories.$inferSelect;
export type InsertMarketCategory = typeof marketCategories.$inferInsert;

// â”€â”€â”€ Market Listings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const marketListings = mysqlTable("marketListings", {
  id:            int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),                       // FK â†’ organizations.id (ownership)
  farmId:        int("farmId"),                                          // FK â†’ farms.id (optional origin)
  sellerUserId:  int("sellerUserId").notNull(),                          // FK â†’ users.id (who created it)
  categoryId:    int("categoryId"),                                      // FK â†’ marketCategories.id
  title:         varchar("title", { length: 128 }).notNull(),
  description:   text("description"),
  price:         decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency:      varchar("currency", { length: 8 }).default("KES").notNull(),
  quantity:      decimal("quantity", { precision: 10, scale: 2 }),
  unit:          varchar("unit", { length: 32 }),                        // "bags", "kg", "litres", "heads"
  county:        varchar("county", { length: 64 }),
  location:      varchar("location", { length: 256 }),
  contactPhone:  varchar("contactPhone", { length: 32 }),
  status:        mysqlEnum("status", [
    "draft",
    "active",
    "paused",
    "sold",
    "archived",
  ]).default("draft").notNull(),
  publishedAt:   timestamp("publishedAt"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketListing = typeof marketListings.$inferSelect;
export type InsertMarketListing = typeof marketListings.$inferInsert;

// â”€â”€â”€ Market Listing Images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const marketListingImages = mysqlTable("marketListingImages", {
  id:         int("id").autoincrement().primaryKey(),
  listingId:  int("listingId").notNull(),                                // FK â†’ marketListings.id
  storageKey: varchar("storageKey", { length: 512 }).notNull(),          // Forge/S3 key (never raw binary)
  url:        text("url").notNull(),                                     // Served URL /manus-storage/{key}
  sortOrder:  int("sortOrder").default(0).notNull(),
  isPrimary:  boolean("isPrimary").default(false).notNull(),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});

export type MarketListingImage = typeof marketListingImages.$inferSelect;
export type InsertMarketListingImage = typeof marketListingImages.$inferInsert;

// ?????? Workers Module ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

export const workerTeams = mysqlTable("workerTeams", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workers = mysqlTable("workers", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 256 }),
  photoUrl: text("photoUrl"),
  position: varchar("position", { length: 128 }),
  employmentType: mysqlEnum("employmentType", ["full_time", "part_time", "seasonal", "contractor", "temporary"]).default("full_time").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "on_leave", "terminated"]).default("active").notNull(),
  teamId: int("teamId"),
  startDate: date("startDate"),
  skills: text("skills"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workerAttendance = mysqlTable("workerAttendance", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  workerId: int("workerId").notNull(),
  date: date("date").notNull(),
  status: mysqlEnum("status", ["present", "absent", "half_day", "on_leave"]).default("present").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkerTeam = typeof workerTeams.$inferSelect;
export type InsertWorkerTeam = typeof workerTeams.$inferInsert;
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = typeof workers.$inferInsert;
export type WorkerAttendance = typeof workerAttendance.$inferSelect;
export type InsertWorkerAttendance = typeof workerAttendance.$inferInsert;
// Worker Payroll
export const workerPayroll = mysqlTable("workerPayroll", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  workerId: int("workerId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("KES").notNull(),
  periodStart: date("periodStart").notNull(),
  periodEnd: date("periodEnd").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  paymentDate: date("paymentDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Worker Documents
export const workerDocuments = mysqlTable("workerDocuments", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  workerId: int("workerId").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  documentType: mysqlEnum("documentType", ["contract", "id", "certificate", "other"]).default("other").notNull(),
  fileUrl: text("fileUrl").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type WorkerPayroll = typeof workerPayroll.$inferSelect;
export type InsertWorkerPayroll = typeof workerPayroll.$inferInsert;
export type WorkerDocument = typeof workerDocuments.$inferSelect;
export type InsertWorkerDocument = typeof workerDocuments.$inferInsert;

// ─── Poultry Module ────────────────────────────────────────────────────────────

export const poultryFlocks = mysqlTable("poultryFlocks", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  breed: varchar("breed", { length: 128 }),
  birdType: varchar("birdType", { length: 64 }).notNull().default("layer"),
  quantity: int("quantity").default(0).notNull(),
  housing: varchar("housing", { length: 255 }),
  acquisitionDate: date("acquisitionDate"),
  source: varchar("source", { length: 255 }),
  status: mysqlEnum("status", ["active", "sold", "culled", "transferred"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const poultryEggProduction = mysqlTable("poultryEggProduction", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  flockId: int("flockId").notNull(),
  date: date("date").notNull(),
  eggsCollected: int("eggsCollected").default(0).notNull(),
  damagedEggs: int("damagedEggs").default(0).notNull(),
  saleableEggs: int("saleableEggs").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const poultryMortality = mysqlTable("poultryMortality", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  flockId: int("flockId").notNull(),
  date: date("date").notNull(),
  quantity: int("quantity").notNull(),
  suspectedCause: varchar("suspectedCause", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const poultryHealthLogs = mysqlTable("poultryHealthLogs", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  flockId: int("flockId").notNull(),
  date: date("date").notNull(),
  condition: varchar("condition", { length: 255 }),
  affectedQuantity: int("affectedQuantity"),
  treatment: text("treatment"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Dairy Module ──────────────────────────────────────────────────────────────

export const dairyAnimals = mysqlTable("dairyAnimals", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }),
  tagNumber: varchar("tagNumber", { length: 64 }),
  breed: varchar("breed", { length: 128 }),
  gender: mysqlEnum("gender", ["male", "female"]).default("female").notNull(),
  birthDate: date("birthDate"),
  acquisitionDate: date("acquisitionDate"),
  acquisitionType: mysqlEnum("acquisitionType", ["born", "purchased", "donated", "other"]).default("born"),
  status: mysqlEnum("status", ["active", "sold", "deceased", "transferred"]).default("active").notNull(),
  parentMaleId: int("parentMaleId"),
  parentFemaleId: int("parentFemaleId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dairyMilkProduction = mysqlTable("dairyMilkProduction", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId").notNull(),
  date: date("date").notNull(),
  morningVolume: decimal("morningVolume", { precision: 8, scale: 2 }).default("0.00"),
  eveningVolume: decimal("eveningVolume", { precision: 8, scale: 2 }).default("0.00"),
  totalVolume: decimal("totalVolume", { precision: 8, scale: 2 }).default("0.00"),
  qualityNotes: text("qualityNotes"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dairyBreeding = mysqlTable("dairyBreeding", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId").notNull(),
  eventDate: date("eventDate").notNull(),
  method: varchar("method", { length: 128 }),
  sireInfo: varchar("sireInfo", { length: 255 }),
  pregnancyStatus: mysqlEnum("pregnancyStatus", ["pending", "confirmed", "failed"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dairyCalving = mysqlTable("dairyCalving", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId").notNull(),
  expectedDate: date("expectedDate"),
  actualDate: date("actualDate"),
  calfCount: int("calfCount").default(1),
  complications: text("complications"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Beekeeping Module ────────────────────────────────────────────────────────

export const beeApiaries = mysqlTable("beeApiaries", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  location: varchar("location", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const beeHives = mysqlTable("beeHives", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  apiaryId: int("apiaryId").notNull(),
  identifier: varchar("identifier", { length: 64 }).notNull(),
  hiveType: varchar("hiveType", { length: 64 }),
  colonyStatus: mysqlEnum("colonyStatus", ["strong", "moderate", "weak", "empty", "dead"]).default("moderate").notNull(),
  installationDate: date("installationDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const beeQueens = mysqlTable("beeQueens", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  hiveId: int("hiveId").notNull(),
  introductionDate: date("introductionDate"),
  origin: varchar("origin", { length: 255 }),
  status: mysqlEnum("status", ["present", "missing", "replaced", "dead"]).default("present").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const beeInspections = mysqlTable("beeInspections", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  hiveId: int("hiveId").notNull(),
  date: date("date").notNull(),
  colonyStrength: mysqlEnum("colonyStrength", ["strong", "moderate", "weak"]),
  queenObserved: boolean("queenObserved").default(false),
  honeyStores: varchar("honeyStores", { length: 128 }),
  pestsDiseases: text("pestsDiseases"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const beeHarvests = mysqlTable("beeHarvests", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  apiaryId: int("apiaryId").notNull(),
  hiveId: int("hiveId"),
  harvestDate: date("harvestDate").notNull(),
  quantityKg: decimal("quantityKg", { precision: 8, scale: 2 }).default("0.00"),
  qualityGrade: varchar("qualityGrade", { length: 64 }),
  storageDestination: varchar("storageDestination", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Aquaculture Module ───────────────────────────────────────────────────────

export const aquaProductionUnits = mysqlTable("aquaProductionUnits", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  identifier: varchar("identifier", { length: 64 }).notNull(),
  unitType: mysqlEnum("unitType", ["pond", "tank", "cage", "raceway"]).notNull(),
  capacityLiters: decimal("capacityLiters", { precision: 10, scale: 2 }),
  location: varchar("location", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const aquaStocking = mysqlTable("aquaStocking", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  unitId: int("unitId").notNull(),
  species: varchar("species", { length: 128 }).notNull(),
  quantity: int("quantity").notNull(),
  stockingDate: date("stockingDate").notNull(),
  source: varchar("source", { length: 255 }),
  initialWeightG: decimal("initialWeightG", { precision: 8, scale: 2 }),
  costPerUnit: decimal("costPerUnit", { precision: 8, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const aquaWaterQuality = mysqlTable("aquaWaterQuality", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  unitId: int("unitId").notNull(),
  measurementDate: date("measurementDate").notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  pH: decimal("pH", { precision: 4, scale: 2 }),
  dissolvedOxygen: decimal("dissolvedOxygen", { precision: 5, scale: 2 }),
  ammonia: decimal("ammonia", { precision: 5, scale: 2 }),
  nitrite: decimal("nitrite", { precision: 5, scale: 2 }),
  salinity: decimal("salinity", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const aquaHarvests = mysqlTable("aquaHarvests", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  unitId: int("unitId").notNull(),
  species: varchar("species", { length: 128 }),
  harvestDate: date("harvestDate").notNull(),
  quantity: int("quantity"),
  totalWeightKg: decimal("totalWeightKg", { precision: 8, scale: 2 }),
  averageWeightG: decimal("averageWeightG", { precision: 8, scale: 2 }),
  grade: varchar("grade", { length: 64 }),
  destination: varchar("destination", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const aquaGrowthLogs = mysqlTable("aquaGrowthLogs", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  unitId: int("unitId").notNull(),
  species: varchar("species", { length: 128 }),
  logDate: date("logDate").notNull(),
  sampleSize: int("sampleSize"),
  averageWeightG: decimal("averageWeightG", { precision: 8, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const aquaMortality = mysqlTable("aquaMortality", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  unitId: int("unitId").notNull(),
  species: varchar("species", { length: 128 }),
  date: date("date").notNull(),
  quantity: int("quantity").notNull(),
  suspectedCause: varchar("suspectedCause", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

