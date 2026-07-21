# Vend-a-Shu (VAS)

Rebuild of the user's Vend-a-Shu app: an Expo (React Native) mobile app for an
automated shoe storage unit, backed by a real API server. The original project
(single-file React Native app + Flask/SQLite backend + Raspberry Pi hardware
driver) was pasted in as attached text files; user asked to keep it the same.

## Structure

- `artifacts/vend-a-shu` — Expo app. Flow: splash → onboarding (4 slides) →
  connect → select user → home → Add / Vend / Return shoes. Orange `#F97316`
  + navy `#1E3A5F` palette, "VENDA/SHU" logo, emoji shoe thumbnails (matches
  the original look).
- `artifacts/api-server` — Express API mirroring the original Flask contract:
  users, shoes, bins, bins/available, vend, vend/done, return. Seeds the 6
  default users, 96 bins (SS-A..SS-F × C1..C6-mapped, rows R1-R4, locations
  LF/R/RF/FB), and 6 sample shoes on first start (`src/lib/seed.ts`).
- `artifacts/api-server/src/lib/hardware.ts` — hardware layer in simulation
  mode (mirrors the Pi PCA9685 driver's off-hardware behavior). Same API
  contract as the physical unit.
- `lib/api-spec/openapi.yaml` — API source of truth; run
  `pnpm --filter @workspace/api-spec run codegen` after edits.
- `lib/db/src/schema/` — Drizzle schema (users, shoes, bins) replacing the
  original SQLite schema. Push with `pnpm --filter @workspace/db run push`.

## Domain rules

- Boots (`shoeType` contains "boot") occupy a Full Bin (FB); other shoes take
  one of LF / R / RF slots.
- Shoe status: `stored` → `vended` (vend) → `stored` (return) or `removed`
  (permanent removal frees the bin).
- Remembered user stored in AsyncStorage (`vas.rememberedUser`); splash skips
  onboarding when set.

## User preferences

- Keep the app the same as the original for now; future ideas mentioned:
  background removal for shoe photos (rembg), web export.
