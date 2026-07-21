/**
 * Hardware control layer for the VAS unit.
 *
 * On the physical unit, a Raspberry Pi 4B drives servos and LEDs through
 * PCA9685 boards over I2C (one board per subsection SS-A..SS-F at addresses
 * 0x40..0x45; servo channels 0-3 map to rows R1-R4, LED channels 4-7).
 *
 * This server runs off-hardware, so it mirrors the Pi driver's simulation
 * mode: every call logs the action and reports success. The API contract is
 * identical, so pointing the app at the Pi later requires no app changes.
 */
import { logger } from "./logger";

export const SUBSECTIONS = [
  "SS-A",
  "SS-B",
  "SS-C",
  "SS-D",
  "SS-E",
  "SS-F",
] as const;

export const HARDWARE_AVAILABLE = false;

export function vendBin(subsection: string, binRow: string): boolean {
  // Real hardware: blink LED 3x, servo to 90deg (eject ~1in), hold LED on.
  logger.info({ subsection, binRow }, "[SIM] Vending bin (eject + LED on)");
  return true;
}

export function closeBin(subsection: string, binRow: string): boolean {
  // Real hardware: servo to 0deg (retract), LED off.
  logger.info({ subsection, binRow }, "[SIM] Closing bin (retract + LED off)");
  return true;
}
