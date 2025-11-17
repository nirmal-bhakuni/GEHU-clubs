import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
// Note: we dynamically import Vite inside `setupVite` so the Vite package
// won't be loaded in production builds. This avoids CJS/ESM deprecation
// warnings and prevents tsc from needing to parse the project's `vite.config.ts`.
import { nanoid } from "nanoid";

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
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };
  const viteModule = await import("vite");
  const createViteServer = viteModule.createServer as typeof viteModule.createServer;
  const createLogger = viteModule.createLogger as typeof viteModule.createLogger;
  const viteLogger = createLogger();

  const vite = await createViteServer({
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg: any, options: any) => {
        // Forward Vite errors to the default logger but do NOT exit the
        // process. Exiting here caused the entire Node process to terminate
        // on pre-transform issues (for example when Vite failed to load
        // `/src/main.tsx`), which made the dev environment brittle.
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(process.cwd(), "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // The client build writes to the repository `dist` folder (see root `vite.config.ts`).
  // When the server runs from the `server` directory, the built client is at `../dist`.
  const distPath = path.resolve(process.cwd(), "..", "dist");

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
