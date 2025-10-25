import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  phoneNumber: text("phone_number").notNull(),
  scheduledFor: timestamp("scheduled_for", { mode: "string" }).notNull(),
  status: text("status", { enum: ["pending", "sent", "failed"] }).notNull().default("pending"),
  completed: boolean("completed").notNull().default(false),
});

export const insertReminderSchema = createInsertSchema(reminders, {
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  phoneNumber: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (E.164 format recommended)"),
  scheduledFor: z.string().min(1, "Schedule date and time is required"),
}).omit({
  id: true,
  status: true,
  completed: true,
});

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
