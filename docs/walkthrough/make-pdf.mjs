import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(DIR, "vend-a-shu-walkthrough.pdf");

const NAVY = "#1e3a5f";
const ORANGE = "#f97316";
const GREY = "#6b7280";

const pages = [
  {
    img: "01-onboarding.jpg",
    step: "Step 1 — Get Set Up",
    title: "Onboarding",
    body: "When you open Vend-a-Shu for the first time, a short onboarding tour introduces the app. The first screen reminds you to connect to the same Wi-Fi network as your VAS (Vend-a-Shu) unit — the app talks to the unit over your home network. Tap Next to move through the tour.",
  },
  {
    img: "02-connect.jpg",
    step: "Step 2 — Connect",
    title: "Connect to Database",
    body: "This screen links the app to your VAS unit. If you are running against a Raspberry Pi VAS unit, enter its IP address and port. When using the built-in VAS database (as shown here — note the green \u201CVAS database online\u201D badge), both fields are optional: just tap Connect.",
  },
  {
    img: "03-select-user.jpg",
    step: "Step 3 — Sign In",
    title: "Select Your User",
    body: "Pick your name from the Select User dropdown so shoes are stored under the right owner. Turn on \u201CRemember me\u201D to skip this screen next time, then tap \u201CGo to my VAS\u201D to enter the app.",
  },
  {
    img: "04-home.jpg",
    step: "Step 4 — Home Base",
    title: "Home Screen",
    body: "Your dashboard at a glance: how many shoes are stored and how many are currently out of their bins. From here you can Add Shoes (store a new pair), Vend Shoes (have the unit eject a pair), Return Shoes (put a pair back), or open Options. Use \u201CSwitch User\u201D at the bottom to change owners, and the \u201C?\u201D button for help.",
  },
  {
    img: "05-add-shoes.jpg",
    step: "Step 5 — Add Shoes",
    title: "Photo Studio",
    body: "Adding a pair starts in the Photo Studio. Take a photo with your camera or pick one from your library — the app automatically cuts out the background so your shoes look studio-ready. Then choose a backdrop: clean White or one of eight premade scenes (Studio Grey, Warm Wood, Marble, Sunset Orange, Concrete Loft, Blush Pink, Midnight Navy, Botanical). You can also skip the photo entirely with \u201CContinue without photo.\u201D Next, fill in the shoe details (type, color, designer, season, material) and the app assigns the pair to a bin in your unit.",
  },
  {
    img: "06-vend-shoes.jpg",
    step: "Step 6 — Vend Shoes",
    title: "Vend Shoes",
    body: "Browse everything stored in your unit — each pair shows its photo (or an icon if no photo was taken). Search by type, color, or designer, or narrow down with the Season, Color, Brand, and Material filters. Tap a pair, confirm, and the VAS unit ejects the bin holding your shoes and lights it up.",
  },
  {
    img: "07-return-shoes.jpg",
    step: "Step 7 — Return Shoes",
    title: "Return Shoes",
    body: "Anything you vended shows up here until it goes back. Tap the pair you are returning, and the unit opens the correct bin so the shoes always land in their assigned home. When nothing is out, you will see this empty state. That completes the cycle: add, vend, return.",
  },
];

const doc = new PDFDocument({ size: "LETTER", margin: 0, autoFirstPage: false });
doc.pipe(fs.createWriteStream(OUT));
const W = 612, H = 792;

// ---- Cover page ----
doc.addPage();
doc.rect(0, 0, W, H).fill("#f4f6fa");
doc.rect(0, 0, W, 8).fill(ORANGE);
doc.fillColor(GREY).font("Helvetica").fontSize(13).text("V E N D A", 70, 200, { characterSpacing: 2 });
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(44).text("Vend-a-Shu", 68, 218);
doc.fillColor(ORANGE).font("Helvetica-Bold").fontSize(20).text("App Walkthrough", 70, 275);
doc.fillColor(GREY).font("Helvetica").fontSize(12).text(
  "A step-by-step guide to storing, photographing, vending, and returning your shoes with your automated Vend-a-Shu storage unit.",
  70, 320, { width: 420, lineGap: 4 },
);
doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(12).text("What's inside", 70, 400);
doc.fillColor("#374151").font("Helvetica").fontSize(11);
let y = 422;
for (const p of pages) {
  doc.text(`${p.step.replace(" \u2014 ", ":  ")} \u2014 ${p.title}`, 86, y);
  y += 20;
}
doc.fillColor(GREY).fontSize(9).text("Generated July 2026", 70, H - 60);

// ---- Step pages ----
for (const p of pages) {
  doc.addPage();
  doc.rect(0, 0, W, H).fill("#ffffff");
  doc.rect(0, 0, W, 8).fill(ORANGE);

  doc.fillColor(ORANGE).font("Helvetica-Bold").fontSize(11).text(p.step.toUpperCase(), 56, 44, { characterSpacing: 1 });
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(26).text(p.title, 56, 62);

  // Screenshot left, text right
  const imgPath = path.join(DIR, p.img);
  const imgW = 250;
  const imgH = imgW * (874 / 402);
  const imgY = 120;
  doc.save();
  doc.roundedRect(56, imgY, imgW, imgH, 12).lineWidth(1).stroke("#d1d5db");
  doc.roundedRect(56, imgY, imgW, imgH, 12).clip();
  doc.image(imgPath, 56, imgY, { width: imgW, height: imgH });
  doc.restore();

  doc.fillColor("#374151").font("Helvetica").fontSize(11.5)
    .text(p.body, 336, imgY + 8, { width: 222, lineGap: 5 });

  doc.fillColor(GREY).font("Helvetica").fontSize(9)
    .text(`Vend-a-Shu Walkthrough  \u2022  ${p.title}`, 56, H - 42);
}

doc.end();
console.log("Wrote", OUT);
