# Vend-A-Shu

A shoe-inventory and dispensing prototype with an Expo mobile client, an Express API, a PostgreSQL database, and a Raspberry Pi hardware-command worker. This repository contains more than a frontend: the API, shared types, database schema, and hardware integration are in the same pnpm workspace.

## Layout

- `artifacts/vend-a-shu/`: Expo/React Native app, onboarding, server connection, and shoe-management screens.
- `artifacts/api-server/`: Express API and dispensing-command integration.
- `lib/db/`: Drizzle schema and PostgreSQL connection.
- `lib/api-spec/`: OpenAPI source.
- `lib/api-client-react/` and `lib/api-zod/`: shared API client/schema packages.
- `hardware/pi/`: Pi command worker and servo control.
- `hardware/supabase/`: hardware command-queue SQL.
- `docs/raspberry-pi-setup.md`: hardware setup notes.

## Development prerequisites

Use Node.js, pnpm, and PostgreSQL. The root install hook rejects npm/yarn; use pnpm for this workspace.

```bash
pnpm install
```

Review `.env.example` and set the required variables in your process environment. The API and database tools require `DATABASE_URL`; the API also requires `PORT` (for example, 8080). A copied `.env` file is a configuration reference, not a guarantee that every workspace command automatically loads it.

For hardware-command integration, configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a matching `DEVICE_ID`. Keep service-role keys server-side and out of any `EXPO_PUBLIC_` setting. Begin with `HARDWARE_DRY_RUN=true`; never point a development session at an unattended live dispensing device.

## Database and API

Against a disposable development database, apply the schema and start the API:

```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
```

The API startup also invokes database seeding. Do not run schema-push or seed commands against a production database without reviewing their effects.

## Mobile client

For a standard local Expo session, rather than the Replit-specific wrapper:

```bash
pnpm --filter @workspace/vend-a-shu exec expo start
```

Use the app's Connect flow to enter the API server origin. A physical phone must use a reachable LAN address or hosted origin, not the computer's `localhost`. The existing package `dev` script is tailored to Replit host/proxy variables.

## Checks

From the repository root:

```bash
pnpm run typecheck
pnpm run build
```

## Status and limits

This is a multi-part prototype, not evidence of a verified production machine. Hardware behavior requires a configured Supabase queue, matching device IDs, a Pi worker, and safely wired actuators. UI success alone does not prove a shoe was dispensed. Review the hardware notes before enabling real motion. Dependency installation, schema changes, builds, and hardware operation were not run for this documentation update.
