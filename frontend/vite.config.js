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
 host: '0.0.0.0',
 port: 3000,
 },
 preview: {
 host: '0.0.0.0',
 port: 3000,
 },
 build: {
 outDir: "build",
 sourcemap: false,
 },
});
