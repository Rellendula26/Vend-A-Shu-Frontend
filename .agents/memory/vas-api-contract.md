---
name: VAS API contract decision
description: Why the rebuilt Vend-a-Shu API uses camelCase instead of the original Flask snake_case
---

The rebuilt Vend-a-Shu backend intentionally uses camelCase field names (userId, shoeId, binRow…) instead of the original Flask app's snake_case wire format.

**Why:** the Expo app in this repo is the only client, and it consumes generated hooks from the OpenAPI spec — the whole chain is consistent end to end. Wire compatibility with the retired Flask server has no consumer.

**How to apply:** if the user later wants the app to talk to the real Raspberry Pi Flask server, add a snake_case translation layer (or update the Pi server) rather than assuming the contracts match. Boots→FB, status transitions (stored→vended→stored/removed), and bin reservation are enforced server-side with a transaction — keep any new endpoints enforcing these too.
