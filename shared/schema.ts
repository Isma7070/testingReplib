import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'client']);
export const kpiStatusEnum = pgEnum('kpi_status', ['good', 'warning', 'critical']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('client'),
  clientId: text("client_id"), // null for admin users
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Providers table
export const providers = pgTable("providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SKU dimension table
export const dimSku = pgTable("dim_sku", {
  sku: text("sku").primaryKey(),
  description: text("description"),
  category: text("category"),
  clientId: text("client_id").notNull(),
});

// Time dimension table
export const dimTime = pgTable("dim_time", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
});

// Team dimension table
export const dimTeam = pgTable("dim_team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shiftType: text("shift_type"),
});

// Fact tables
export const factInbound = pgTable("fact_inbound", {
  id: uuid("id").primaryKey().defaultRandom(),
  arrivalDateFk: integer("arrival_date_fk").notNull(),
  providerId: text("provider_id").notNull(),
  clientId: text("client_id").notNull(),
  sku: text("sku").notNull(),
  receivedUnits: integer("received_units").notNull(),
  damagedUnits: integer("damaged_units").default(0),
  arrivalAt: timestamp("arrival_at").notNull(),
  putawayAt: timestamp("putaway_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const factOutbound = pgTable("fact_outbound", {
  id: uuid("id").primaryKey().defaultRandom(),
  releasedDateFk: integer("released_date_fk").notNull(),
  clientId: text("client_id").notNull(),
  teamId: text("team_id"),
  sku: text("sku").notNull(),
  orderId: text("order_id").notNull(),
  promisedDate: timestamp("promised_date").notNull(),
  shippedDate: timestamp("shipped_date"),
  pickedUnits: integer("picked_units").notNull(),
  orderedUnits: integer("ordered_units").notNull(),
  readyAt: timestamp("ready_at"),
  cutoffTime: timestamp("cutoff_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const factInventory = pgTable("fact_inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  snapshotDateFk: integer("snapshot_date_fk").notNull(),
  sku: text("sku").notNull(),
  clientId: text("client_id").notNull(),
  systemQty: integer("system_qty").notNull(),
  physicalQty: integer("physical_qty").notNull(),
  stockQty: integer("stock_qty").notNull(),
  avgDailyDemand: decimal("avg_daily_demand", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// KPI Targets table
export const dimKpiTargets = pgTable("dim_kpi_targets", {
  id: serial("id").primaryKey(),
  clientId: text("client_id"),
  kpiCode: text("kpi_code").notNull(),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alerts table
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  kpiCode: text("kpi_code").notNull(),
  clientId: text("client_id").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(), // 'high', 'medium', 'low'
  value: text("value").notNull(),
  threshold: text("threshold").notNull(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  clientId: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  id: true,
  name: true,
});

export const insertProviderSchema = createInsertSchema(providers).pick({
  id: true,
  name: true,
});

export const insertFactInboundSchema = createInsertSchema(factInbound).omit({
  id: true,
  createdAt: true,
});

export const insertFactOutboundSchema = createInsertSchema(factOutbound).omit({
  id: true,
  createdAt: true,
});

export const insertFactInventorySchema = createInsertSchema(factInventory).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type FactInbound = typeof factInbound.$inferSelect;
export type FactOutbound = typeof factOutbound.$inferSelect;
export type FactInventory = typeof factInventory.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;

// KPI types
export interface KpiData {
  code: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  delta: number;
  trend: number[];
  lastUpdated: string;
}

export interface KpiDetailData {
  trend: Array<{ date: string; value: number; target: number }>;
  distribution: Array<{ category: string; value: number; target: number; orders?: number }>;
  detail: Array<{
    id: string;
    orderId?: string;
    client: string;
    promisedDate?: string;
    deliveryDate?: string;
    quantity?: number;
    value: number;
    status: string;
  }>;
}

export interface FilterParams {
  dateRange: string;
  clientId?: string;
  providerId?: string;
  from?: string;
  to?: string;
}
