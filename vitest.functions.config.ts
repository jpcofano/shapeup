import { defineConfig } from "vitest/config";

// Tests de la Cloud Function contra el emulador de Firestore (P89).
// environment node; firebase-admin sale de functions/node_modules.
export default defineConfig({
  test: {
    environment: "node",
    include: ["functions/src/**/*.emulador.test.ts"],
    testTimeout: 15000,
  },
});
