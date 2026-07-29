import { Router, type IRouter } from "express";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, usersTable, shoesTable, binsTable } from "@workspace/db";
import type { Shoe, User, Bin } from "@workspace/db";
import {
  CreateUserBody,
  ListUsersResponse,
  CreateUserResponse,
  ListShoesQueryParams,
  ListShoesResponse,
  AddShoeBody,
  AddShoeResponse,
  GetShoeParams,
  GetShoeResponse,
  RemoveShoeParams,
  RemoveShoeResponse,
  ListBinsResponse,
  ListAvailableBinsResponse,
  VendShoeBody,
  VendShoeResponse,
  VendDoneBody,
  VendDoneResponse,
  ReturnShoeBody,
  ReturnShoeResponse,
} from "@workspace/api-zod";
import { resolveHardwareMapping } from "../lib/hardware-mapping";
import { enqueueDispenseCommand } from "../lib/enqueue-dispense";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function serializeUser(u: User) {
  return { ...u, createdAt: u.createdAt?.toISOString() ?? null };
}

// Explicit projection that excludes the photoData blob — list/detail reads
// must never drag base64 image data out of the DB.
const shoeColumns = {
  id: shoesTable.id,
  userId: shoesTable.userId,
  shoeType: shoesTable.shoeType,
  construction: shoesTable.construction,
  season: shoesTable.season,
  color: shoesTable.color,
  designer: shoesTable.designer,
  subsection: shoesTable.subsection,
  binCol: shoesTable.binCol,
  binRow: shoesTable.binRow,
  binLocation: shoesTable.binLocation,
  isBoots: shoesTable.isBoots,
  labelText: shoesTable.labelText,
  status: shoesTable.status,
  imagePath: shoesTable.imagePath,
  createdAt: shoesTable.createdAt,
  updatedAt: shoesTable.updatedAt,
} as const;

function serializeShoe(s: Omit<Shoe, "photoData">) {
  return { ...s, createdAt: s.createdAt?.toISOString() ?? null };
}

// Accept only reasonably-sized JPEG/PNG data URIs for stored shoe photos.
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
function validatePhotoBase64(input: string): string | null {
  if (!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(input)) {
    return "photoBase64 must be a JPEG or PNG data URI";
  }
  if (input.length > (MAX_PHOTO_BYTES * 4) / 3 + 64) {
    return "Photo is too large (max 3MB)";
  }
  return null;
}

function serializeBin(b: Bin) {
  return b;
}

// Users
router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.name);
  res.json(ListUsersResponse.parse(users.map(serializeUser)));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const name = parsed.data.name.trim();
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.name, name));
  if (existing.length > 0) {
    res.status(400).json({ error: "User already exists" });
    return;
  }
  const [user] = await db.insert(usersTable).values({ name }).returning();
  res.status(201).json(CreateUserResponse.parse(serializeUser(user!)));
});

// Shoes
router.get("/shoes", async (req, res): Promise<void> => {
  const query = ListShoesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const userId = query.data.userId;
  const where =
    userId != null
      ? and(ne(shoesTable.status, "removed"), eq(shoesTable.userId, userId))
      : ne(shoesTable.status, "removed");
  const shoes = await db
    .select(shoeColumns)
    .from(shoesTable)
    .where(where)
    .orderBy(desc(shoesTable.createdAt));
  res.json(ListShoesResponse.parse(shoes.map(serializeShoe)));
});

router.get("/shoes/:id", async (req, res): Promise<void> => {
  const params = GetShoeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [shoe] = await db
    .select(shoeColumns)
    .from(shoesTable)
    .where(eq(shoesTable.id, params.data.id));
  if (!shoe) {
    res.status(404).json({ error: "Shoe not found" });
    return;
  }
  res.json(GetShoeResponse.parse(serializeShoe(shoe)));
});

router.post("/shoes", async (req, res): Promise<void> => {
  const parsed = AddShoeBody.safeParse(req.body);
  if (parsed.success && parsed.data.photoBase64) {
    const photoError = validatePhotoBase64(parsed.data.photoBase64);
    if (photoError) {
      res.status(400).json({ error: photoError });
      return;
    }
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [bin] = await db
    .select()
    .from(binsTable)
    .where(
      and(
        eq(binsTable.subsection, data.subsection),
        eq(binsTable.binCol, data.binCol),
        eq(binsTable.binRow, data.binRow),
        eq(binsTable.binLocation, data.binLocation),
      ),
    );
  if (!bin) {
    res.status(400).json({ error: "Bin does not exist" });
    return;
  }
  if (bin.status !== "available") {
    res.status(409).json({ error: "Bin is not available" });
    return;
  }

  const isBoots = /boot/i.test(data.shoeType);
  if (isBoots && data.binLocation !== "FB") {
    res.status(400).json({ error: "Boots require a Full Bin (FB) slot" });
    return;
  }
  if (!isBoots && data.binLocation === "FB") {
    res
      .status(400)
      .json({ error: "Only boots may occupy a Full Bin (FB) slot" });
    return;
  }

  try {
    const shoe = await db.transaction(async (tx) => {
      // Conditional update first: fails if another request grabbed the bin.
      const claimed = await tx
        .update(binsTable)
        .set({ status: "occupied" })
        .where(and(eq(binsTable.id, bin.id), eq(binsTable.status, "available")))
        .returning();
      if (claimed.length === 0) {
        throw new Error("BIN_TAKEN");
      }
      const [inserted] = await tx
        .insert(shoesTable)
        .values({
          userId: data.userId,
          shoeType: data.shoeType,
          construction: data.construction ?? "",
          season: data.season ?? "",
          color: data.color ?? "",
          designer: data.designer ?? "",
          subsection: data.subsection,
          binCol: data.binCol,
          binRow: data.binRow,
          binLocation: data.binLocation,
          isBoots,
          labelText: data.labelText ?? "",
          status: "stored",
          photoData: data.photoBase64 ?? null,
        })
        .returning();
      await tx
        .update(binsTable)
        .set({ shoeId: inserted!.id })
        .where(eq(binsTable.id, bin.id));
      if (data.photoBase64) {
        const [withPath] = await tx
          .update(shoesTable)
          .set({ imagePath: `/api/shoes/${inserted!.id}/photo` })
          .where(eq(shoesTable.id, inserted!.id))
          .returning();
        return withPath!;
      }
      return inserted!;
    });
    res.status(201).json(AddShoeResponse.parse(serializeShoe(shoe)));
  } catch (err) {
    if (err instanceof Error && err.message === "BIN_TAKEN") {
      res.status(409).json({ error: "Bin is not available" });
      return;
    }
    throw err;
  }
});

router.delete("/shoes/:id", async (req, res): Promise<void> => {
  const params = RemoveShoeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [shoe] = await db
    .select()
    .from(shoesTable)
    .where(eq(shoesTable.id, params.data.id));
  if (!shoe) {
    res.status(404).json({ error: "Shoe not found" });
    return;
  }
  await db
    .update(shoesTable)
    .set({ status: "removed" })
    .where(eq(shoesTable.id, shoe.id));
  await db
    .update(binsTable)
    .set({ status: "available", shoeId: null })
    .where(eq(binsTable.shoeId, shoe.id));
  res.json(RemoveShoeResponse.parse({ message: "Shoe permanently removed" }));
});

// Shoe photo (binary, outside the JSON API)
router.get("/shoes/:id/photo", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [shoe] = await db
    .select({ photoData: shoesTable.photoData })
    .from(shoesTable)
    .where(eq(shoesTable.id, id));
  if (!shoe?.photoData) {
    res.status(404).json({ error: "No photo for this shoe" });
    return;
  }
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/.exec(shoe.photoData);
  const mime = match ? match[1]! : "image/jpeg";
  const data = Buffer.from(match ? match[2]! : shoe.photoData, "base64");
  res.setHeader("Content-Type", mime);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(data);
});

// Bins
router.get("/bins", async (_req, res): Promise<void> => {
  const bins = await db
    .select()
    .from(binsTable)
    .orderBy(binsTable.subsection, binsTable.binRow);
  res.json(ListBinsResponse.parse(bins.map(serializeBin)));
});

router.get("/bins/available", async (_req, res): Promise<void> => {
  const bins = await db
    .select()
    .from(binsTable)
    .where(eq(binsTable.status, "available"))
    .orderBy(binsTable.subsection, binsTable.binRow);
  res.json(ListAvailableBinsResponse.parse(bins.map(serializeBin)));
});

const HARDWARE_UNAVAILABLE_MESSAGE =
  "This bin is not connected to physical hardware on the current prototype. Only the first four bins in SS-A / C1 / R1 are hardware-enabled.";

// Vend
router.post("/vend", async (req, res): Promise<void> => {
  const parsed = VendShoeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [shoe] = await db
    .select()
    .from(shoesTable)
    .where(eq(shoesTable.id, parsed.data.shoeId));
  if (!shoe) {
    res.status(404).json({ error: "Shoe not found" });
    return;
  }
  if (shoe.status !== "stored") {
    res
      .status(409)
      .json({ error: `Shoe cannot be vended (status: ${shoe.status})` });
    return;
  }

  const hardware = resolveHardwareMapping({
    subsection: shoe.subsection,
    binCol: shoe.binCol,
    binRow: shoe.binRow,
    binLocation: shoe.binLocation,
  });
  if (!hardware.enabled) {
    res.status(422).json({ error: HARDWARE_UNAVAILABLE_MESSAGE });
    return;
  }

  const enqueueResult = await enqueueDispenseCommand(
    hardware.mapping.supabaseAction,
  );
  if (!enqueueResult.ok) {
    if (enqueueResult.reason === "drawer_busy") {
      res.status(409).json({
        error: "A dispense command is already pending for this drawer",
      });
      return;
    }
    res.status(503).json({ error: "Hardware command queue unavailable" });
    return;
  }

  if (enqueueResult.dryRun) {
    res.json(
      VendShoeResponse.parse({
        message:
          "Dry run: bin would eject (no command queued, inventory unchanged)",
        subsection: shoe.subsection,
        binCol: shoe.binCol,
        binRow: shoe.binRow,
        binLocation: shoe.binLocation,
        hardware: false,
      }),
    );
    return;
  }

  const [updated] = await db
    .update(shoesTable)
    .set({ status: "vended" })
    .where(and(eq(shoesTable.id, shoe.id), eq(shoesTable.status, "stored")))
    .returning();

  if (!updated) {
    logger.fatal(
      { commandId: enqueueResult.commandId, shoeId: shoe.id },
      "CRITICAL: Supabase command queued but shoe status update failed",
    );
    res.status(500).json({
      error: "Hardware command queued but inventory update failed",
    });
    return;
  }

  res.json(
    VendShoeResponse.parse({
      message: "Bin ejected",
      subsection: shoe.subsection,
      binCol: shoe.binCol,
      binRow: shoe.binRow,
      binLocation: shoe.binLocation,
      hardware: true,
    }),
  );
});

router.post("/vend/done", async (req, res): Promise<void> => {
  const parsed = VendDoneBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [shoe] = await db
    .select()
    .from(shoesTable)
    .where(eq(shoesTable.id, parsed.data.shoeId));
  if (!shoe) {
    res.status(404).json({ error: "Shoe not found" });
    return;
  }
  if (shoe.status !== "vended") {
    res
      .status(409)
      .json({ error: `Shoe is not out of its bin (status: ${shoe.status})` });
    return;
  }

  if (!parsed.data.permanent) {
    res.json(VendDoneResponse.parse({ message: "Vend complete" }));
    return;
  }

  try {
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(shoesTable)
        .set({ status: "removed" })
        .where(
          and(eq(shoesTable.id, shoe.id), eq(shoesTable.status, "vended")),
        )
        .returning();
      if (!updated) {
        throw new Error("SHOE_NOT_VENDED");
      }
      await tx
        .update(binsTable)
        .set({ status: "available", shoeId: null })
        .where(eq(binsTable.shoeId, shoe.id));
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SHOE_NOT_VENDED") {
      res.status(409).json({
        error: `Shoe is not out of its bin (status: ${shoe.status})`,
      });
      return;
    }
    logger.error({ err, shoeId: shoe.id }, "Permanent removal failed");
    res.status(500).json({ error: "Failed to complete permanent removal" });
    return;
  }

  res.json(VendDoneResponse.parse({ message: "Done confirmed" }));
});

router.post("/return", async (req, res): Promise<void> => {
  const parsed = ReturnShoeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [shoe] = await db
    .select()
    .from(shoesTable)
    .where(eq(shoesTable.id, parsed.data.shoeId));
  if (!shoe) {
    res.status(404).json({ error: "Shoe not found" });
    return;
  }
  if (shoe.status !== "vended") {
    res
      .status(409)
      .json({ error: `Shoe cannot be returned (status: ${shoe.status})` });
    return;
  }
  await db
    .update(shoesTable)
    .set({ status: "stored" })
    .where(eq(shoesTable.id, shoe.id));
  res.json(ReturnShoeResponse.parse({ message: "Shoe returned to bin" }));
});

export default router;
