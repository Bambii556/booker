import {
  pgTable,
  text,
  time,
  timestamp,
  index,
  uniqueIndex,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// BetterAuth tables

export const user = pgTable("user", {
  id: t.text("id").primaryKey(),
  name: t.text("name").notNull(),
  email: t.varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: t.boolean("email_verified").notNull(),
  image: t.text("image"),
  createdAt: t
    .timestamp("created_at", { precision: 6, withTimezone: true })
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { precision: 6, withTimezone: true })
    .notNull(),
});

export const session = pgTable("session", {
  id: t.text("id").primaryKey(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: t.varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: t
    .timestamp("expires_at", { precision: 6, withTimezone: true })
    .notNull(),
  ipAddress: t.text("ip_address"),
  userAgent: t.text("user_agent"),
  createdAt: t
    .timestamp("created_at", { precision: 6, withTimezone: true })
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { precision: 6, withTimezone: true })
    .notNull(),
});

export const account = pgTable("account", {
  id: t.text("id").primaryKey(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: t.text("account_id").notNull(),
  providerId: t.text("provider_id").notNull(),
  accessToken: t.text("access_token"),
  refreshToken: t.text("refresh_token"),
  accessTokenExpiresAt: t.timestamp("access_token_expires_at", {
    precision: 6,
    withTimezone: true,
  }),
  refreshTokenExpiresAt: t.timestamp("refresh_token_expires_at", {
    precision: 6,
    withTimezone: true,
  }),
  scope: t.text("scope"),
  idToken: t.text("id_token"),
  password: t.text("password"),
  createdAt: t
    .timestamp("created_at", { precision: 6, withTimezone: true })
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { precision: 6, withTimezone: true })
    .notNull(),
});

export const verification = pgTable("verification", {
  id: t.text("id").primaryKey(),
  identifier: t.text("identifier").notNull(),
  value: t.text("value").notNull(),
  expiresAt: t
    .timestamp("expires_at", { precision: 6, withTimezone: true })
    .notNull(),
  createdAt: t
    .timestamp("created_at", { precision: 6, withTimezone: true })
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { precision: 6, withTimezone: true })
    .notNull(),
});

// Additional tables for the booking system

export const branches = pgTable("branches", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  openingTime: time("opening_time", { withTimezone: false }).notNull(),
  closingTime: time("closing_time", { withTimezone: false }).notNull(),
  timezone: text("timezone").notNull().default("Africa/Johannesburg"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingReference: text("booking_reference").notNull().unique(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("pending"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_appointments_branch_scheduled").on(
      table.branchId,
      table.scheduledAt,
      table.status,
    ),
    uniqueIndex("idx_unique_active_appointment")
      .on(table.branchId, table.scheduledAt)
      .where(sql`${table.status} = 'confirmed'`),
  ],
);

export const usersRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionsRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountsRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  branch: one(branches, {
    fields: [appointments.branchId],
    references: [branches.id],
  }),
}));

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
