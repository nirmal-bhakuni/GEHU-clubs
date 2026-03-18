import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  clubId: varchar("club_id"),
});

export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(120),
  location: text("location").notNull(),
  category: text("category").notNull(),
  clubId: varchar("club_id").notNull(),
  clubName: text("club_name").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
});

export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
}).extend({
  facultyAssigned: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  eligibility: z.string().optional(),
  eligibilityYears: z.array(z.string()).optional(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
}).extend({
  durationMinutes: z.coerce.number().int().min(15).max(720).default(120),
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubs.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
