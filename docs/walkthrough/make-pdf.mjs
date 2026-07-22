import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(DIR, "vend-a-shu-walkthrough.pdf");
const BG_DIR = path.resolve(DIR, "../../artifacts/api-server/assets/backgrounds");

const REV = "Rev A \u2014 July 21, 2026";
const COMPANY = "Brainchild Engineering";

const NAVY = "#1e3a5f";
const ORANGE = "#f97316";
const GREY = "#6b7280";
const BODY = "#374151";

const W = 612, H = 792;
const M = 56; // margin

const doc = new PDFDocument({ size: "LETTER", margin: 0, autoFirstPage: false });
doc.pipe(fs.createWriteStream(OUT));

function footer(label) {
  doc.fillColor(GREY).font("Helvetica").fontSize(8.5)
    .text(`Vend-a-Shu App Walkthrough  \u2022  ${label}  \u2022  ${REV}  \u2022  ${COMPANY}`, M, H - 40, { width: W - 2 * M });
}

function pageHeader(step, title) {
  doc.rect(0, 0, W, 8).fill(ORANGE);
  doc.fillColor(ORANGE).font("Helvetica-Bold").fontSize(10.5).text(step.toUpperCase(), M, 40, { characterSpacing: 1 });
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(24).text(title, M, 57);
}

function bullets(items, x, y, width, opts = {}) {
  const size = opts.size ?? 10;
  const gap = opts.gap ?? 6;
  doc.font("Helvetica").fontSize(size);
  for (const item of items) {
    doc.fillColor(ORANGE).text("\u2022", x, y, { continued: false });
    doc.fillColor(BODY).text(item, x + 12, y, { width: width - 12, lineGap: 2.5 });
    y = doc.y + gap;
  }
  return y;
}

// ============ COVER ============
doc.addPage();
doc.rect(0, 0, W, H).fill("#f4f6fa");
doc.rect(0, 0, W, 8).fill(ORANGE);
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(44).text("Vend-a-Shu", M + 12, 180);
doc.fillColor(ORANGE).font("Helvetica-Bold").fontSize(20).text("Complete App Walkthrough", M + 14, 236);
doc.fillColor(GREY).font("Helvetica").fontSize(12).text(
  "A detailed, step-by-step operating guide for the Vend-a-Shu automated shoe storage system: connecting the app, managing users, photographing shoes with automatic background removal, storing, vending, and returning pairs.",
  M + 14, 275, { width: 430, lineGap: 4 },
);
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(12).text("Contents", M + 14, 370);
doc.fillColor(BODY).font("Helvetica").fontSize(10.5);
let cy = 392;
const toc = [
  "1.  System Overview & Requirements",
  "2.  First Launch: Onboarding Tour",
  "3.  Connecting to Your VAS Unit",
  "4.  Selecting Your User",
  "5.  The Home Screen",
  "6.  Adding Shoes \u2014 Part 1: The Photo Studio",
  "7.  Adding Shoes \u2014 Part 2: Backdrop Gallery",
  "8.  Vending Shoes",
  "9.  Returning Shoes",
  "10.  Label Printing with the ColAura (Coming Soon)",
  "11.  Troubleshooting & FAQ",
];
for (const t of toc) { doc.text(t, M + 30, cy); cy += 19; }
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text(`Prepared by ${COMPANY}`, M + 14, H - 120);
doc.fillColor(GREY).font("Helvetica").fontSize(10).text(REV, M + 14, H - 102);
footer("Cover");

// ============ 1. OVERVIEW ============
doc.addPage();
pageHeader("Section 1", "System Overview & Requirements");
doc.fillColor(BODY).font("Helvetica").fontSize(10.5).text(
  "Vend-a-Shu (VAS) is an automated shoe storage system. Each pair of shoes lives in an assigned bin inside the unit. The mobile app is your remote control: it keeps a catalog of every pair (with a studio-quality photo), tells the unit which bin to eject when you want a pair, and guides shoes back to their correct bin when you return them.",
  M, 100, { width: W - 2 * M, lineGap: 4 });
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13).text("How the pieces fit together", M, doc.y + 16);
let oy = doc.y + 8;
oy = bullets([
  "The app (phone or tablet) \u2014 the interface you interact with.",
  "The VAS server & database \u2014 keeps the master record of users, shoes, bins, and photos. Runs either on the built-in cloud database or on a Raspberry Pi inside your unit.",
  "The storage unit hardware \u2014 physical bins organized by column (C1\u2013C6), row (R1\u2013R4), and location (LF/RF). The app addresses bins by these coordinates; when you vend, the correct bin ejects and its LED lights up.",
], M, oy, W - 2 * M);
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13).text("What you need before starting", M, oy + 10);
oy = doc.y + 8;
oy = bullets([
  "A phone or tablet with the Vend-a-Shu app installed.",
  "Your device on the same Wi-Fi network as the VAS unit (for Raspberry Pi installations).",
  "A user profile (created in Options) so shoes are stored under the correct owner.",
  "Camera or photo library access if you want automatic shoe photos \u2014 the app will request permission the first time; you can decline and add shoes without photos.",
], M, oy, W - 2 * M);
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13).text("Access your collection from anywhere", M, oy + 10);
oy = doc.y + 8;
oy = bullets([
  "Your VAS data is not locked to your home network: the catalog \u2014 every pair, photo, and status \u2014 can be accessed remotely from your phone.",
  "This is especially handy while shopping: pull up your collection in the store to check whether you already own a similar pair, what colors you have, or which designers dominate your closet before buying.",
  "Vending and returning still require you to be at the unit (the hardware has to physically eject a bin), but browsing, searching, and reviewing your catalog work from anywhere.",
], M, oy, W - 2 * M);
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13).text("Key rules the system enforces for you", M, oy + 10);
oy = doc.y + 8;
bullets([
  "Boots are automatically routed to boot-compatible bins only \u2014 you cannot accidentally assign boots to a standard bin.",
  "A pair can only move through valid states: stored, then vended, then stored again (or removed). The app will never let a pair be vended twice or returned when it is not out.",
  "Photos are validated (JPEG/PNG, max 3 MB after processing) and stored with the shoe record, so the catalog thumbnail always matches the pair in the bin.",
], M, oy, W - 2 * M);
footer("System Overview");

// ============ SCREEN PAGES ============
function screenPage(step, title, img, intro, bulletTitle, items, note) {
  doc.addPage();
  pageHeader(step, title);
  const imgW = 218;
  const imgH = imgW * (874 / 402);
  const imgY = 104;
  doc.save();
  doc.roundedRect(M, imgY, imgW, imgH, 12).lineWidth(1).stroke("#d1d5db");
  doc.roundedRect(M, imgY, imgW, imgH, 12).clip();
  doc.image(path.join(DIR, img), M, imgY, { width: imgW, height: imgH });
  doc.restore();
  const tx = M + imgW + 24, tw = W - M - tx;
  doc.fillColor(BODY).font("Helvetica").fontSize(10).text(intro, tx, imgY + 2, { width: tw, lineGap: 3.5 });
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11.5).text(bulletTitle, tx, doc.y + 12);
  let by = doc.y + 6;
  by = bullets(items, tx, by, tw, { size: 9.5, gap: 5 });
  if (note) {
    doc.roundedRect(tx, by + 4, tw, 0.1); // anchor
    const noteY = by + 6;
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9.5).text("Note for the meticulous:", tx, noteY, { width: tw });
    doc.fillColor(BODY).font("Helvetica").fontSize(9.5).text(note, tx, doc.y + 2, { width: tw, lineGap: 3 });
  }
  footer(title);
}

screenPage(
  "Section 2 \u2014 First Launch", "Onboarding Tour", "01-onboarding.jpg",
  "The very first time you open the app, a short guided tour walks you through what the system does before you touch any controls. Nothing is saved or changed during onboarding \u2014 it is purely informational, and you will only see it once.",
  "What to do on this screen",
  [
    "Read the prompt: your device must be on the same Wi-Fi network as the VAS unit. The app communicates over your local network; cellular data alone will not reach a Raspberry Pi unit.",
    "The dots below the text show your position in the tour (screen 1 of 4). Each screen introduces one concept.",
    "Tap the orange Next button to advance. There is no data entry anywhere in the tour.",
  ],
  "If you switch Wi-Fi networks later (e.g., a new router), the app does not need to be reinstalled \u2014 you will simply re-enter the unit's address on the Connect screen.",
);

screenPage(
  "Section 3 \u2014 Connecting", "Connect to Database", "02-connect.jpg",
  "This screen establishes the link between the app and the VAS database \u2014 the record of every user, shoe, bin, and photo. The app checks connectivity for you: the green \u201CVAS database online\u201D badge means the built-in database has already been found.",
  "Field-by-field",
  [
    "IP Address (optional) \u2014 only needed for a Raspberry Pi VAS unit on your local network. Find it on the unit's info panel or your router's device list. Leave blank to use the built-in database.",
    "Port (optional) \u2014 the network port for a Raspberry Pi unit; supplied with your unit's documentation. Leave blank for the built-in database.",
    "Connect \u2014 with the green badge showing, just tap Connect. If you entered an IP/port, the app validates the connection before proceeding and tells you explicitly if it fails.",
    "The yellow help box (\u201CWhere can I find my IP?\u201D) is always visible on this screen for reference.",
  ],
  "The connection is remembered for future launches. You only return to this screen if the unit becomes unreachable or you deliberately reconnect to a different unit.",
);

screenPage(
  "Section 4 \u2014 Signing In", "Select Your User", "03-select-user.jpg",
  "Every shoe in the system belongs to a specific user, so the app needs to know who is operating it. This screen sets the active user for the session.",
  "What to do on this screen",
  [
    "Select User \u2014 open the dropdown and choose your name. The list comes live from the database; if your name is missing, a user must first be created in Options.",
    "Remember me \u2014 leave this on (default) and the app will skip straight to Home on future launches. Turn it off on a shared device if each person should pick their own name every time.",
    "Go to my VAS \u2014 confirms your selection and opens the Home screen. The button will not proceed until a user is selected.",
  ],
  "Your selection controls which shoes you see when vending: the catalog can be filtered to the active user's shoes, and new pairs you add are recorded under your name.",
);

screenPage(
  "Section 5 \u2014 Home", "The Home Screen", "04-home.jpg",
  "The Home screen is mission control. The two counters at the top are live statistics pulled from the database every time you land here \u2014 they are not cached.",
  "Every element, explained",
  [
    "Shoes stored (orange number) \u2014 total pairs currently inside the unit under the active user.",
    "Out of bins (navy number) \u2014 pairs that have been vended and not yet returned. If this is not zero, something is out of the unit right now.",
    "Add Shoes \u2014 begins the two-step intake flow: Photo Studio first, then shoe details and automatic bin assignment.",
    "Vend Shoes \u2014 browse the catalog and have the unit eject a pair.",
    "Return Shoes \u2014 put a vended pair back into its assigned bin.",
    "Options \u2014 user management and system settings.",
    "Switch User \u2014 returns to the user-selection screen without disconnecting from the unit.",
    "? (top right) \u2014 in-app help.",
  ],
  null,
);

screenPage(
  "Section 6 \u2014 Adding Shoes (1 of 2)", "The Photo Studio", "05-add-shoes.jpg",
  "Adding a pair begins with an optional photo. The Photo Studio turns an ordinary phone snapshot into a catalog-quality product image: the app automatically detects your shoes and removes the entire background \u2014 no cropping, tracing, or editing on your part.",
  "The full photo workflow",
  [
    "Take Photo \u2014 opens the camera (the app asks permission on first use). Best results: shoes on any surface, reasonable lighting, whole pair in frame.",
    "From Library \u2014 pick an existing photo instead.",
    "Processing \u2014 after you choose an image, a spinner appears for roughly five seconds while the background is removed on the server. The original photo never leaves your VAS system \u2014 no third-party photo service is involved.",
    "Preview & backdrop \u2014 the cutout appears composited on a clean white background. Tap any swatch in the \u201CChoose a background\u201D row to instantly re-composite onto that backdrop (see next page for the full gallery).",
    "Continue without photo \u2014 fully supported. The pair will show a shoe-type icon in the catalog instead of a photo.",
    "Cancel \u2014 abandons intake entirely; nothing is saved.",
  ],
  "If processing fails (e.g., an unreadable image), the app tells you exactly why and lets you retry with another photo. Photos are downscaled to 900 px and capped at 3 MB before storage, so intake never bloats the database.",
);

// ============ 7. BACKDROP GALLERY ============
doc.addPage();
pageHeader("Section 7 \u2014 Adding Shoes (2 of 2)", "Backdrop Gallery");
doc.fillColor(BODY).font("Helvetica").fontSize(10).text(
  "Nine backdrop options are available for every photo. \u201CWhite\u201D is the default catalog look; the eight premade scenes below are professionally generated studio backdrops stored on the VAS server. Switching backdrops re-composites the same cutout \u2014 you never need to retake the photo. Your chosen backdrop is baked into the saved image.",
  M, 100, { width: W - 2 * M, lineGap: 3.5 });
const gallery = [
  ["Studio Grey", "thumb-bg-studio-grey.jpg", "Neutral seamless grey; the classic product-photo look."],
  ["Warm Wood", "thumb-bg-warm-wood.jpg", "Natural wooden floor with warm tones; homey and organic."],
  ["Marble", "thumb-bg-marble.jpg", "Polished white marble; bright, premium, high-contrast."],
  ["Sunset Orange", "thumb-bg-sunset-orange.jpg", "Bold orange gradient matching the app's accent color."],
  ["Concrete Loft", "thumb-bg-concrete.jpg", "Smooth polished concrete; modern industrial feel."],
  ["Blush Pink", "thumb-bg-blush-pink.jpg", "Soft pastel pink studio paper; gentle and fashionable."],
  ["Midnight Navy", "thumb-bg-midnight-navy.jpg", "Deep navy with a soft spotlight; moody and premium."],
  ["Botanical", "thumb-bg-botanical.jpg", "Blurred greenery on a cream wall; fresh and natural."],
];
let gx = M, gy = doc.y + 16;
const cell = 112, gapX = 18, textH = 58;
gallery.forEach(([name, file, desc], i) => {
  const col = i % 4, row = Math.floor(i / 4);
  const x = M + col * (cell + gapX);
  const y = gy + row * (cell + textH + 14);
  doc.save();
  doc.roundedRect(x, y, cell, cell, 8).clip();
  doc.image(path.join(DIR, file), x, y, { width: cell, height: cell, cover: [cell, cell] });
  doc.restore();
  doc.roundedRect(x, y, cell, cell, 8).lineWidth(0.8).stroke("#d1d5db");
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9.5).text(name, x, y + cell + 5, { width: cell });
  doc.fillColor(GREY).font("Helvetica").fontSize(8).text(desc, x, doc.y + 1, { width: cell, lineGap: 1.5 });
});
doc.fillColor(BODY).font("Helvetica").fontSize(10).text(
  "After the photo, step two of intake collects the details: shoe type, construction/material, season, color, designer, and subsection. The system then assigns the pair to an appropriate bin automatically \u2014 boots go only to boot-compatible bins \u2014 and shows you the final record (photo included) for confirmation before saving.",
  M, gy + 2 * (cell + textH + 14) + 6, { width: W - 2 * M, lineGap: 3.5 });
footer("Backdrop Gallery");

screenPage(
  "Section 8 \u2014 Vending", "Vend Shoes", "06-vend-shoes.jpg",
  "The Vend screen is your full catalog: every pair currently stored in the unit, each showing its studio photo (or a shoe-type icon if no photo was taken) with type and designer beneath.",
  "Finding and vending a pair",
  [
    "Search bar \u2014 matches against type, color, and designer as you type.",
    "Filter chips \u2014 Season, Color, Brand, and Material each open a filter; combine them to narrow a large collection quickly.",
    "Tap a pair \u2014 opens a detail view with the full photo and every recorded attribute, plus the exact bin location (column, row, LF/RF).",
    "Confirm vend \u2014 the unit ejects the bin holding your shoes and lights its LED so you can find it at a glance. The pair's status changes to \u201Cout,\u201D the Home counters update, and it appears on the Return screen.",
  ],
  "Only pairs with status \u201Cstored\u201D appear here \u2014 a pair that is already out cannot be vended a second time; the system enforces this at the database level, not just in the interface.",
);

screenPage(
  "Section 9 \u2014 Returning", "Return Shoes", "07-return-shoes.jpg",
  "Everything currently out of the unit is listed here. The screenshot shows the empty state \u2014 the message confirms nothing is out, which is exactly what you want to see at the end of the day.",
  "Returning a pair",
  [
    "Search bar \u2014 filter by shoe type if several pairs are out at once.",
    "Tap the pair you are physically holding \u2014 a confirmation view shows its photo and its assigned bin.",
    "Confirm \u2014 the unit opens that pair's own bin (never a different one), you place the shoes inside, and the status flips back to \u201Cstored.\u201D",
    "The Home screen's \u201COut of bins\u201D counter decreases immediately.",
  ],
  "Because every pair has a permanent assigned bin, shoes always return to the same location \u2014 the system never shuffles pairs between bins, so physical organization stays consistent forever.",
);

// ============ 10. LABEL PRINTING (COMING SOON) ============
doc.addPage();
pageHeader("Section 10 \u2014 Coming Soon", "Label Printing with the ColAura");
// "Coming soon" ribbon
doc.roundedRect(W - M - 150, 44, 150, 22, 11).fill("#fff7ed");
doc.fillColor(ORANGE).font("Helvetica-Bold").fontSize(9).text("FEATURE IN DEVELOPMENT", W - M - 141, 51);

doc.fillColor(BODY).font("Helvetica").fontSize(10.5).text(
  "Every pair stored in Vend-a-Shu already carries label text in its record \u2014 a compact summary of the shoe's type, owner, and bin assignment. The next revision of the system will print these as full-color physical labels using the Brother ColAura (VC-500W) color photo & label printer, so each bin can be labeled with the very photo and details stored in the app.",
  M, 104, { width: W - 2 * M, lineGap: 4 });

// Product photo, right-aligned
const cpW = 190, cpH = cpW * (500 / 501); // near-square
const cpX = W - M - cpW, cpY = doc.y + 18;
doc.save();
doc.roundedRect(cpX, cpY, cpW, cpH, 12).clip();
doc.image(path.join(DIR, "colaura-2.jpg"), cpX, cpY, { width: cpW, height: cpH, cover: [cpW, cpH] });
doc.restore();
doc.roundedRect(cpX, cpY, cpW, cpH, 12).lineWidth(1).stroke("#d1d5db");
doc.fillColor(GREY).font("Helvetica").fontSize(8).text("Brother ColAura (VC-500W) color photo & label printer", cpX, cpY + cpH + 6, { width: cpW });

// About the printer, left column
const lcW = W - 2 * M - cpW - 24;
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13).text("About the printer", M, cpY);
let ly = doc.y + 8;
ly = bullets([
  "Full-color, ink-free printing (ZINK\u00AE zero-ink technology) \u2014 no cartridges to replace.",
  "Prints labels up to 2\u2033 wide and 17\u2033 long at 313 dpi \u2014 room for a shoe photo, owner name, and bin coordinates on one label.",
  "Connects over Wi-Fi, so the VAS system can send labels directly without cables.",
  "Compact countertop footprint \u2014 it can live right next to the VAS unit.",
], M, ly, lcW, { size: 9.5, gap: 5 });

doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13).text("How it will work", M, Math.max(ly + 8, cpY + cpH + 30));
let hy = doc.y + 8;
hy = bullets([
  "When you finish adding a pair, a Print Label button will appear on the confirmation screen.",
  "The label will include the studio photo (with your chosen backdrop), shoe type, designer, owner, and the bin coordinates (column / row / location) \u2014 stick it on the bin front for at-a-glance identification without opening the app.",
  "Labels for existing pairs will be printable retroactively from the shoe detail view \u2014 every record already stores the label text, so no re-entry will be needed.",
], M, hy, W - 2 * M, { size: 9.5, gap: 5 });

doc.roundedRect(M, hy + 8, W - 2 * M, 54, 8).fill("#fff7ed");
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10).text("Status of this feature", M + 14, hy + 18);
doc.fillColor(BODY).font("Helvetica").fontSize(9.5).text(
  "ColAura label printing is planned but not yet available in Rev A \u2014 this detail is yet to be added. No action is needed now; when the feature ships, existing shoe records will print without any migration or re-entry.",
  M + 14, doc.y + 3, { width: W - 2 * M - 28, lineGap: 3 });
footer("Label Printing (Coming Soon)");

// ============ 11. TROUBLESHOOTING ============
doc.addPage();
pageHeader("Section 11", "Troubleshooting & FAQ");
const qa = [
  ["The photo background removal fails with an error.", "Retry with a clearer photo: good lighting, shoes fully in frame, JPEG or PNG format. The app reports the exact reason (invalid image vs. processing failure). Processing takes ~5 seconds \u2014 the spinner is normal, not a hang."],
  ["I don't see the newest features in my app.", "The published (live) app updates only when a new version is published. If a feature exists in preview but not in your app, a republish is needed."],
  ["The backgrounds row is empty.", "The backdrop images live on the VAS server. Verify the app is connected (Connect screen shows the green online badge) and try again."],
  ["A pair shows an icon instead of a photo.", "That pair was added with \u201CContinue without photo.\u201D Photos are attached at intake; to add one, remove and re-add the pair with a photo."],
  ["Can two people use the same unit?", "Yes. Create a user per person in Options; shoes are recorded per owner. Use Switch User on the Home screen to change the active person, and turn off \u201CRemember me\u201D on shared devices."],
  ["What are the photo limits?", "JPEG or PNG input; the processed image is downscaled to 900 px on its longest side and must be under 3 MB \u2014 both are handled automatically, so ordinary phone photos always fit."],
  ["The unit ejected the wrong bin / nothing happened.", "Check the bin coordinates shown on the confirmation screen against the unit's labels. If the mismatch persists, power-cycle the unit and reconnect from the Connect screen."],
  ["Can I access my shoe catalog away from home?", "Yes \u2014 browsing, searching, and reviewing your collection works remotely, e.g. while shopping, so you can check what you already own before buying. Only vending and returning require you to be physically at the unit."],
  ["Can I print labels for the shoe bins?", "Shoe label printing via the Colaura printer is planned but not yet available in this revision \u2014 this detail is yet to be added. Each pair already has label text recorded in the system, so existing records will be printable as soon as the feature ships."],
];
let qy = 100;
for (const [q, a] of qa) {
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10.5).text(`Q.  ${q}`, M, qy, { width: W - 2 * M });
  doc.fillColor(BODY).font("Helvetica").fontSize(10).text(`A.  ${a}`, M + 14, doc.y + 3, { width: W - 2 * M - 14, lineGap: 3 });
  qy = doc.y + 14;
}
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text(`Prepared by ${COMPANY}`, M, H - 90);
doc.fillColor(GREY).font("Helvetica").fontSize(9.5).text(`${REV}. Screens captured from the current application build on the date above.`, M, H - 72, { width: W - 2 * M });
footer("Troubleshooting & FAQ");

doc.end();
console.log("Wrote", OUT);
