import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false).notNull(),
  gender: text('gender', { enum: ['male', 'female'] }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const spots = sqliteTable('spots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address'),
  description: text('description'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  spotId: integer('spot_id').references(() => spots.id),
  userId: integer('user_id').notNull().references(() => users.id),
  isLead: integer('is_lead', { mode: 'boolean' }).default(false).notNull(),
  note: text('note'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const rotations = sqliteTable('rotations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  spotId: integer('spot_id').notNull().references(() => spots.id),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at').notNull(),
  intervalMinutes: integer('interval_minutes').notNull(),
  userOrder: text('user_order'),  // JSON array of userIds
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const rotationSlots = sqliteTable('rotation_slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rotationId: integer('rotation_id').notNull().references(() => rotations.id),
  slotIndex: integer('slot_index').notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
  duty: text('duty', { enum: ['service', 'watching', 'break'] }).notNull(),
});

export const themes = sqliteTable('themes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  weekStart: text('week_start').notNull().unique(), // YYYY-MM-DD (月曜日)
  title: text('title').notNull(),
  body: text('body'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const vacationRequests = sqliteTable('vacation_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  date: text('date').notNull(),
  comment: text('comment'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
