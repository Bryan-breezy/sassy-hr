import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core"

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert

export const routePlans = mysqlTable("routePlans", {
  id: int("id").autoincrement().primaryKey(),
  submittedBy: int("submittedBy").notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(),
  totalCost: varchar("totalCost", { length: 32 }).notNull().default("0"),
  status: mysqlEnum("status", ["submitted", "reviewed"]).default("submitted").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
})

export type RoutePlan = typeof routePlans.$inferSelect
export type InsertRoutePlan = typeof routePlans.$inferInsert

export const routePlanDays = mysqlTable("routePlanDays", {
  id: int("id").autoincrement().primaryKey(),
  routePlanId: int("routePlanId").notNull(),
  day: varchar("day", { length: 12 }).notNull(),
  fromLocation: varchar("fromLocation", { length: 160 }).notNull(),
  toLocation: varchar("toLocation", { length: 160 }).notNull(),
  plannedArrival: varchar("plannedArrival", { length: 5 }).notNull(),
  departure: varchar("departure", { length: 5 }).notNull(),
  transportMode: varchar("transportMode", { length: 32 }).notNull(),
  cost: varchar("cost", { length: 32 }).notNull().default("0"),
})

export type RoutePlanDay = typeof routePlanDays.$inferSelect
export type InsertRoutePlanDay = typeof routePlanDays.$inferInsert