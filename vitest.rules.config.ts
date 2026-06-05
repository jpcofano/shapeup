import { defineConfig } from "vitest/config";

// Config separada para tests de reglas Firestore (environment: node, requiere emulador).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/__tests__/firestore.rules.test.ts"],
    testTimeout: 15000,
  },
});
