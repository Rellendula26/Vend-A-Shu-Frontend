---
name: On-server background removal setup
description: Quirks getting @imgly/background-removal-node running in the bundled Express api-server
---

The api-server does shoe-photo background removal locally with `@imgly/background-removal-node` (free, no API key) + sharp compositing.

**Why this combo:** user asked for a free remove.bg-style service; the imgly package bundles its ONNX model in the npm package, so no external API or key is needed at runtime.

**How to apply / gotchas (took several failed restarts):**
- esbuild bundling breaks it: `@imgly/*` must be in the `external` list in the api-server build config, and `onnxruntime-node` must be added as a direct dependency of the api-server (pnpm strict layout won't resolve it transitively from dist).
- imgly pins old sharp 0.32 whose native binary fails to install under pnpm's blocked build scripts; fixed with a root `pnpm.overrides` forcing `sharp: ^0.35.3`.
- Bundled server runs from `dist/`, so runtime asset paths (`assets/backgrounds`) must be resolved relative to dist, not src.
- Processing takes ~5s per photo on CPU; images are downscaled to ~900px before segmentation to keep that stable.
