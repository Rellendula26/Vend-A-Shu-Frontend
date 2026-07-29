/**
 * Vercel serverless entry — plain .mjs so @vercel/node skips TypeScript emit.
 * The Express app is pre-bundled by build.mjs (dist/app.mjs).
 */
import app from "../dist/app.mjs";

export default app;
