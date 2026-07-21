import { Router, type IRouter } from "express";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";
import {
  ListPhotoBackgroundsResponse,
  ProcessPhotoBody,
  ProcessPhotoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Runs from dist/ after bundling; fall back to the source layout just in case.
const BACKGROUNDS_DIR = [
  path.resolve(import.meta.dirname, "../assets/backgrounds"),
  path.resolve(import.meta.dirname, "../../assets/backgrounds"),
].find((p) => fs.existsSync(p)) ?? path.resolve(process.cwd(), "assets/backgrounds");

const BACKGROUNDS: { id: string; name: string; file: string }[] = [
  { id: "studio-grey", name: "Studio Grey", file: "bg-studio-grey.png" },
  { id: "warm-wood", name: "Warm Wood", file: "bg-warm-wood.png" },
  { id: "marble", name: "Marble", file: "bg-marble.png" },
  { id: "sunset-orange", name: "Sunset Orange", file: "bg-sunset-orange.png" },
];

const OUTPUT_SIZE = 900;

function decodeBase64Image(input: string): Buffer {
  const match = /^data:image\/[a-zA-Z+]+;base64,(.*)$/.exec(input);
  return Buffer.from(match ? match[1]! : input, "base64");
}

router.get("/photos/backgrounds", (_req, res): void => {
  res.json(
    ListPhotoBackgroundsResponse.parse(
      BACKGROUNDS.filter((b) =>
        fs.existsSync(path.join(BACKGROUNDS_DIR, b.file)),
      ).map((b) => ({
        id: b.id,
        name: b.name,
        url: `/api/photos/backgrounds/${b.id}.jpg`,
      })),
    ),
  );
});

// Preview image for a premade background (static binary, outside the JSON API).
router.get("/photos/backgrounds/:id.jpg", async (req, res): Promise<void> => {
  const bg = BACKGROUNDS.find((b) => b.id === req.params.id);
  if (!bg) {
    res.status(404).json({ error: "Background not found" });
    return;
  }
  const file = path.join(BACKGROUNDS_DIR, bg.file);
  if (!fs.existsSync(file)) {
    res.status(404).json({ error: "Background not found" });
    return;
  }
  const preview = await sharp(file)
    .resize(300, 300, { fit: "cover" })
    .jpeg({ quality: 75 })
    .toBuffer();
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(preview);
});

router.post("/photos/process", async (req, res): Promise<void> => {
  const parsed = ProcessPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { imageBase64, background } = parsed.data;

  const bgEntry = BACKGROUNDS.find((b) => b.id === background);
  if (
    background !== "white" &&
    background !== "transparent" &&
    (!bgEntry || !fs.existsSync(path.join(BACKGROUNDS_DIR, bgEntry.file)))
  ) {
    res.status(400).json({ error: `Unknown background: ${background}` });
    return;
  }

  const source = decodeBase64Image(imageBase64);
  if (source.length === 0 || source.length > 15 * 1024 * 1024) {
    res.status(400).json({ error: "Image is empty or too large (max 15MB)" });
    return;
  }

  // Downscale before segmentation for speed and stable memory use.
  let prepared: Buffer;
  try {
    prepared = await sharp(source)
      .rotate()
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toBuffer();
  } catch {
    res.status(400).json({ error: "Invalid image data — send a JPEG or PNG photo" });
    return;
  }

  try {
    req.log.info({ bytes: prepared.length, background }, "Removing photo background");
    const cutoutBlob = await removeBackground(
      new Blob([new Uint8Array(prepared)], { type: "image/jpeg" }),
    );
    const cutout = Buffer.from(await cutoutBlob.arrayBuffer());

    let output: Buffer;
    let mime = "image/jpeg";
    if (background === "transparent") {
      output = await sharp(cutout).png().toBuffer();
      mime = "image/png";
    } else if (background === "white") {
      output = await sharp(cutout)
        .flatten({ background: "#FFFFFF" })
        .jpeg({ quality: 90 })
        .toBuffer();
    } else {
      const meta = await sharp(cutout).metadata();
      const width = meta.width ?? OUTPUT_SIZE;
      const height = meta.height ?? OUTPUT_SIZE;
      const backdrop = await sharp(path.join(BACKGROUNDS_DIR, bgEntry!.file))
        .resize(width, height, { fit: "cover" })
        .toBuffer();
      output = await sharp(backdrop)
        .composite([{ input: cutout }])
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    res.json(
      ProcessPhotoResponse.parse({
        imageBase64: `data:${mime};base64,${output.toString("base64")}`,
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Photo background processing failed");
    res.status(500).json({ error: "Background removal failed — please try another photo" });
  }
});

export default router;
