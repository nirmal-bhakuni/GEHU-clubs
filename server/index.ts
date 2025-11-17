import dotenv from "dotenv";
dotenv.config();

import express from "express";
import type { Request, Response, NextFunction } from "express";
import session from "express-session";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectDB } from "./config/db";

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
      // In production we require secure=true and SameSite='none' for cross-site
      // cookies (if serving frontend from a different origin). For local
      // development (vite on :5173 -> backend :5000 via proxy) keep cookies
      // readable by the browser and allow SameSite lax behavior.
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
    // Don't re-throw the error here. In development the Vite middleware may
    // call `next(err)` for recoverable transform errors; re-throwing would
    // crash the entire server process. Log the error and continue so the
    // dev server remains available for debugging.
    console.error('Unhandled error in middleware:', err && err.stack ? err.stack : err);
  });

  if (process.env.NODE_ENV !== "production") {
    // In non-production environments run Vite middleware for HMR + dev server
    await setupVite(app, server);
  } else {
    // In production serve pre-built static assets
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.platform === "win32" ? "localhost" : "0.0.0.0";

  server.listen({ port, host }, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
