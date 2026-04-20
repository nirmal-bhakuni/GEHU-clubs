import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import MemoryStore from "memorystore";
import path from "path";
import cors from "cors";

import { registerRoutes } from "./routes";
import { connectDB } from "./config/db";
import { seedDatabase } from "./seed";
import { log } from "./vite";
import { startUpcomingEventReminderScheduler } from "./services/emailService";

const app = express();

// Global flag to track MongoDB connection status
export let isMongoDBConnected = false;

const configuredCorsOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = configuredCorsOrigins.length
  ? configuredCorsOrigins
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://gehu-clubs.onrender.com",
    ];

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const SessionMemoryStore = MemoryStore(session);

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in production");
}

let sessionStore: ReturnType<typeof MongoStore.create> | InstanceType<typeof SessionMemoryStore>;
if (process.env.MONGO_URI) {
  try {
    sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      touchAfter: 24 * 3600, // Lazy session update - only update if 24h has passed
      stringify: false
    });
    // Add error handler for session store
    sessionStore.on('error', (err: any) => {
      console.error("MongoDB session store error:", err);
    });
  } catch (error) {
    console.error("Failed to initialize MongoDB session store, falling back to memory store:", error);
    sessionStore = new SessionMemoryStore({ checkPeriod: 86400000 });
  }
} else {
  sessionStore = new SessionMemoryStore({ checkPeriod: 86400000 });
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

(async () => {
  try {
    isMongoDBConnected = await connectDB();

    const disableAutoSeed = String(process.env.DISABLE_AUTO_SEED || "").toLowerCase() === "true";
    if (isMongoDBConnected && !disableAutoSeed) {
      await seedDatabase();
    }

    await registerRoutes(app);

    // Global error handler (placed AFTER routes)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled route error:", err);
      
      // Check if headers have already been sent
      if (res.headersSent) {
        console.error("Headers already sent, cannot send error response");
        return;
      }
      
      res.status(500).json({ 
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined 
      });
    });

    startUpcomingEventReminderScheduler();

    const port = parseInt(process.env.PORT || "12346", 10);
    const host = process.env.HOST || "0.0.0.0";

    try {
      const server = app.listen(port, host, () => {
        log(`Serving on http://${host}:${port}`);
        console.log(`Server is actually listening on port ${port}`);
      });

      // Handle server errors
      server.on('error', (error: any) => {
        console.error('Server error:', error);
        process.exit(1);
      });

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }

  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();
