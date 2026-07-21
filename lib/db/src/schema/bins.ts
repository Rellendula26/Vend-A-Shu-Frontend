import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const binsTable = pgTable("bins", {
  id: serial("id").primaryKey(),
  subsection: text("subsection").notNull(),
  binCol: text("bin_col").notNull(),
  binRow: text("bin_row").notNull(),
  binLocation: text("bin_location").notNull(),
  status: text("status").notNull().default("available"),
  shoeId: integer("shoe_id"),
});

export const insertBinSchema = createInsertSchema(binsTable).omit({
  id: true,
});
export type InsertBin = z.infer<typeof insertBinSchema>;
export type Bin = typeof binsTable.$inferSelect;
