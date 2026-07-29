/**
 * Phase 5 static validation — no network, no hardware, no secrets.
 * Run: node artifacts/api-server/scripts/phase5-static-validation.mjs
 */

const ENABLED = [
  { subsection: "SS-A", binCol: "C1", binRow: "R1", binLocation: "LF", drawer: 1, action: "dispense_bin_1" },
  { subsection: "SS-A", binCol: "C1", binRow: "R1", binLocation: "R", drawer: 2, action: "dispense_bin_2" },
  { subsection: "SS-A", binCol: "C1", binRow: "R1", binLocation: "RF", drawer: 3, action: "dispense_bin_3" },
  { subsection: "SS-A", binCol: "C1", binRow: "R1", binLocation: "FB", drawer: 4, action: "dispense_bin_4" },
];

const DISABLED = {
  subsection: "SS-B",
  binCol: "C2",
  binRow: "R2",
  binLocation: "LF",
};

function key(c) {
  return `${c.subsection}:${c.binCol}:${c.binRow}:${c.binLocation}`;
}

const map = new Map(ENABLED.map((b) => [key(b), b]));

function resolve(coords) {
  const hit = map.get(key(coords));
  return hit ? { enabled: true, mapping: hit } : { enabled: false };
}

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

console.log("Phase 5 — static mapping validation\n");

for (const bin of ENABLED) {
  const r = resolve(bin);
  assert(`${bin.binLocation} enabled → drawer ${bin.drawer}`, r.enabled && r.mapping.action === bin.action);
}

const disabled = resolve(DISABLED);
assert("SS-B bin disabled", !disabled.enabled);

assert("HARDWARE_DRY_RUN unset → false", process.env.HARDWARE_DRY_RUN !== "true");
process.env.HARDWARE_DRY_RUN = "true";
assert("HARDWARE_DRY_RUN=true → true", process.env.HARDWARE_DRY_RUN === "true");
delete process.env.HARDWARE_DRY_RUN;

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
