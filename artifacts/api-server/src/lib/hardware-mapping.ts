/**
 * Maps the first four logical bins (canonical seed order) to physical drawers
 * and Supabase dispense actions. GPIO wiring lives in hardware/pi/pi_worker.py.
 */

export type BinCoordinates = {
  subsection: string;
  binCol: string;
  binRow: string;
  binLocation: string;
};

export type PhysicalDrawer = 1 | 2 | 3 | 4;

export type SupabaseDispenseAction =
  | "dispense_bin_1"
  | "dispense_bin_2"
  | "dispense_bin_3"
  | "dispense_bin_4";

export type HardwareEnabledBin = BinCoordinates & {
  /** Expected serial id when bins are seeded via the default seed script. */
  logicalBinId: number;
  drawer: PhysicalDrawer;
  supabaseAction: SupabaseDispenseAction;
};

export const HARDWARE_ENABLED_BINS: readonly HardwareEnabledBin[] = [
  {
    logicalBinId: 1,
    subsection: "SS-A",
    binCol: "C1",
    binRow: "R1",
    binLocation: "LF",
    drawer: 1,
    supabaseAction: "dispense_bin_1",
  },
  {
    logicalBinId: 2,
    subsection: "SS-A",
    binCol: "C1",
    binRow: "R1",
    binLocation: "R",
    drawer: 2,
    supabaseAction: "dispense_bin_2",
  },
  {
    logicalBinId: 3,
    subsection: "SS-A",
    binCol: "C1",
    binRow: "R1",
    binLocation: "RF",
    drawer: 3,
    supabaseAction: "dispense_bin_3",
  },
  {
    logicalBinId: 4,
    subsection: "SS-A",
    binCol: "C1",
    binRow: "R1",
    binLocation: "FB",
    drawer: 4,
    supabaseAction: "dispense_bin_4",
  },
] as const;

export type HardwareLookupResult =
  | { enabled: true; mapping: HardwareEnabledBin }
  | { enabled: false; reason: "not_hardware_enabled" };

function coordinatesKey(coords: BinCoordinates): string {
  return `${coords.subsection}:${coords.binCol}:${coords.binRow}:${coords.binLocation}`;
}

const BY_COORDINATES = new Map<string, HardwareEnabledBin>(
  HARDWARE_ENABLED_BINS.map((bin) => [coordinatesKey(bin), bin]),
);

const BY_LOGICAL_BIN_ID = new Map<number, HardwareEnabledBin>(
  HARDWARE_ENABLED_BINS.map((bin) => [bin.logicalBinId, bin]),
);

const BY_DRAWER = new Map<PhysicalDrawer, HardwareEnabledBin>(
  HARDWARE_ENABLED_BINS.map((bin) => [bin.drawer, bin]),
);

/** All logical bin ids that map to physical hardware on the current prototype. */
export function getHardwareEnabledLogicalBinIds(): readonly number[] {
  return HARDWARE_ENABLED_BINS.map((bin) => bin.logicalBinId);
}

/** Lookup by stable bin coordinates (preferred over serial id). */
export function resolveHardwareMapping(
  coords: BinCoordinates,
): HardwareLookupResult {
  const mapping = BY_COORDINATES.get(coordinatesKey(coords));
  if (!mapping) {
    return { enabled: false, reason: "not_hardware_enabled" };
  }
  return { enabled: true, mapping };
}

/** Lookup by expected serial id from the default seed (ids 1–4 on a fresh database). */
export function resolveHardwareMappingByLogicalBinId(
  logicalBinId: number,
): HardwareLookupResult {
  const mapping = BY_LOGICAL_BIN_ID.get(logicalBinId);
  if (!mapping) {
    return { enabled: false, reason: "not_hardware_enabled" };
  }
  return { enabled: true, mapping };
}

/** Lookup by physical drawer number (1–4). */
export function resolveHardwareMappingByDrawer(
  drawer: PhysicalDrawer,
): HardwareEnabledBin | undefined {
  return BY_DRAWER.get(drawer);
}

/** True when the given coordinates match one of the four hardware-enabled bins. */
export function isHardwareEnabledBin(coords: BinCoordinates): boolean {
  return BY_COORDINATES.has(coordinatesKey(coords));
}

/** Supabase action string for a physical drawer, if hardware-enabled. */
export function supabaseActionForDrawer(
  drawer: PhysicalDrawer,
): SupabaseDispenseAction | undefined {
  return BY_DRAWER.get(drawer)?.supabaseAction;
}
