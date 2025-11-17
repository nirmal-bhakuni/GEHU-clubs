"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertEventSchema = exports.insertClubSchema = exports.insertAdminSchema = exports.events = exports.clubs = exports.admins = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.admins = (0, pg_core_1.pgTable)("admins", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    clubId: (0, pg_core_1.varchar)("club_id"),
});
exports.clubs = (0, pg_core_1.pgTable)("clubs", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    memberCount: (0, pg_core_1.integer)("member_count").notNull().default(0),
    logoUrl: (0, pg_core_1.text)("logo_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().default((0, drizzle_orm_1.sql) `now()`),
});
exports.events = (0, pg_core_1.pgTable)("events", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    date: (0, pg_core_1.text)("date").notNull(),
    time: (0, pg_core_1.text)("time").notNull(),
    location: (0, pg_core_1.text)("location").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    clubId: (0, pg_core_1.varchar)("club_id").notNull(),
    clubName: (0, pg_core_1.text)("club_name").notNull(),
    imageUrl: (0, pg_core_1.text)("image_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().default((0, drizzle_orm_1.sql) `now()`),
});
exports.insertAdminSchema = (0, drizzle_zod_1.createInsertSchema)(exports.admins).omit({
    id: true,
});
exports.insertClubSchema = (0, drizzle_zod_1.createInsertSchema)(exports.clubs).omit({
    id: true,
    createdAt: true,
});
exports.insertEventSchema = (0, drizzle_zod_1.createInsertSchema)(exports.events).omit({
    id: true,
    createdAt: true,
});
