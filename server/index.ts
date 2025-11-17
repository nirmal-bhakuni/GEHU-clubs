import dotenv from "dotenv";
dotenv.config();

import express from "express";
import type { Request, Response, NextFunction } from "express";
import session from "express-session";

import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { connectDB } from "./config/db";

import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "dev-secret-do-not-use-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await connectDB();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });

    console.error(
      "Unhandled error in middleware:",
      err && err.stack ? err.stack : err
    );
  });

  // ⚡ DEVELOPMENT (Vite HMR)
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    // ⚡ PRODUCTION — Serve frontend from server/dist/public
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const publicPath = path.join(__dirname, "public");

    app.use(express.static(publicPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(publicPath, "index.html"));
    });
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.platform === "win32" ? "localhost" : "0.0.0.0";

  server.listen({ port, host }, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
