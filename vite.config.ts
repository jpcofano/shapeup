import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build de producción a /dist (lo que publica Firebase Hosting).
export default defineConfig({
  plugins: [react()],
});
