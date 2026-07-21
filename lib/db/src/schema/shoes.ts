import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const shoesTable = pgTable("shoes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  shoeType: text("shoe_type").notNull(),
  construction: text("construction"),
  season: text("season"),
  color: text("color"),
  designer: text("designer"),
  subsection: text("subsection").notNull(),
  binCol: text("bin_col").notNull(),
  binRow: text("bin_row").notNull(),
  binLocation: text("bin_location").notNull(),
  isBoots: boolean("is_boots").notNull().default(false),
  imagePath: text("image_path"),
  labelText: text("label_text"),
  status: text("status").notNull().default("stored"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertShoeSchema = createInsertSchema(shoesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertShoe = z.infer<typeof insertShoeSchema>;
export type Shoe = typeof shoesTable.$inferSelect;
