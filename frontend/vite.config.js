import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Vite configuration for the Illuminate Studios frontend (React 19 + Tailwind + shadcn/ui).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: parseInt(process.env.PORT || "5173", 10),
    host: "0.0.0.0",
  },
  preview: {
    port: parseInt(process.env.PORT || "3000", 10),
    host: "0.0.0.0",
  },
  build: {
    outDir: "build",
    sourcemap: false,
  },
});
