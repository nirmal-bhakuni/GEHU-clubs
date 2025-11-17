import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // In development, Vite runs on a separate port (5173 or 5174).
  // The frontend proxies /api requests to the backend via its vite.config.ts.
  // This function is a no-op in development.
  log("Development mode: frontend runs on separate Vite dev server");
}

export function serveStatic(app: Express) {
  // The client build writes to the repository `dist` folder (see root `vite.config.ts`).
  // When the server runs from the `server` directory, the built client is at `../dist`.
  const distPath = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

