import { db, usersTable, binsTable, shoesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";
import { SUBSECTIONS } from "./hardware";

const DEFAULT_USERS = [
  "David",
  "Jessica",
  "Angelica",
  "Xavier",
  "Emily",
  "Justin",
];

const ROWS = ["R1", "R2", "R3", "R4"];
const LOCATIONS = ["LF", "R", "RF", "FB"];

const SAMPLE_SHOES = [
  { user: "David", shoeType: "Slip On", construction: "Canvas", season: "Summer", color: "Grey", designer: "Sketchers", subsection: "SS-A", binRow: "R1", binLocation: "RF", isBoots: false },
  { user: "Jessica", shoeType: "Heels", construction: "Leather", season: "Winter", color: "Black", designer: "Gucci", subsection: "SS-B", binRow: "R2", binLocation: "LF", isBoots: false },
  { user: "David", shoeType: "Sneakers", construction: "Mesh", season: "Spring", color: "White", designer: "Nike", subsection: "SS-C", binRow: "R3", binLocation: "R", isBoots: false },
  { user: "Angelica", shoeType: "Boots", construction: "Suede", season: "Fall", color: "Brown", designer: "Timberland", subsection: "SS-D", binRow: "R1", binLocation: "FB", isBoots: true },
  { user: "Xavier", shoeType: "Sandals", construction: "Rubber", season: "Summer", color: "Tan", designer: "Birkenstock", subsection: "SS-E", binRow: "R2", binLocation: "LF", isBoots: false },
  { user: "Emily", shoeType: "Loafers", construction: "Leather", season: "All", color: "Navy", designer: "Cole Haan", subsection: "SS-F", binRow: "R4", binLocation: "RF", isBoots: false },
];

export async function seedDatabase(): Promise<void> {
  const existingUsers = await db.select().from(usersTable);
  if (existingUsers.length === 0) {
    await db
      .insert(usersTable)
      .values(DEFAULT_USERS.map((name) => ({ name })));
    logger.info("Seeded default users");
  }

  const existingBins = await db.select().from(binsTable);
  if (existingBins.length === 0) {
    const bins = [];
    for (const ss of SUBSECTIONS) {
      const col = `C${SUBSECTIONS.indexOf(ss) + 1}`;
      for (const row of ROWS) {
        for (const loc of LOCATIONS) {
          bins.push({
            subsection: ss,
            binCol: col,
            binRow: row,
            binLocation: loc,
          });
        }
      }
    }
    await db.insert(binsTable).values(bins);
    logger.info({ count: bins.length }, "Seeded bins");
  }

  const existingShoes = await db.select().from(shoesTable);
  if (existingShoes.length === 0) {
    const users = await db.select().from(usersTable);
    const byName = new Map(users.map((u) => [u.name, u.id]));
    for (const s of SAMPLE_SHOES) {
      const userId = byName.get(s.user);
      if (!userId) continue;
      const col = `C${SUBSECTIONS.indexOf(s.subsection as (typeof SUBSECTIONS)[number]) + 1}`;
      const [shoe] = await db
        .insert(shoesTable)
        .values({
          userId,
          shoeType: s.shoeType,
          construction: s.construction,
          season: s.season,
          color: s.color,
          designer: s.designer,
          subsection: s.subsection,
          binCol: col,
          binRow: s.binRow,
          binLocation: s.binLocation,
          isBoots: s.isBoots,
          status: "stored",
        })
        .returning();
      if (shoe) {
        await db
          .update(binsTable)
          .set({ status: "occupied", shoeId: shoe.id })
          .where(
            and(
              eq(binsTable.subsection, s.subsection),
              eq(binsTable.binRow, s.binRow),
              eq(binsTable.binLocation, s.binLocation),
            ),
          );
      }
    }
    logger.info("Seeded sample shoes");
  }
}
