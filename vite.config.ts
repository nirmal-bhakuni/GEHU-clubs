import { fileURLToPath } from "url";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug alias
console.log("🔍 Alias @ resolves to:", path.resolve(__dirname, "client/src"));

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),       // ✅ Your main alias
      "@shared": path.resolve(__dirname, "shared"),    // ✅ Fixed
      "@assets": path.resolve(__dirname, "attached_assets"), // ✅ Fixed
    },
  },
  root: path.resolve(__dirname, "client"),            // ✅ Fixed
  publicDir: "public",
  build: {
    outDir: path.resolve(__dirname, "dist/public"),   // ✅ Fixed
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
