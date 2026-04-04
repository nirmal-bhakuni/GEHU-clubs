import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import cors from "cors";

import { registerRoutes } from "./routes";
import { connectDB } from "./config/db";
import { seedDatabase } from "./seed";
import { log } from "./vite";
import { startUpcomingEventReminderScheduler } from "./services/emailService";

const app = express();

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
    store: process.env.MONGO_URI 
      ? MongoStore.create({
          mongoUrl: process.env.MONGO_URI,
          collectionName: "sessions"
        })
      : undefined,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ message: "Internal Server Error" });
});

(async () => {
  try {
    const connected = await connectDB();

    const disableAutoSeed = String(process.env.DISABLE_AUTO_SEED || "").toLowerCase() === "true";
    if (connected && !disableAutoSeed) {
      await seedDatabase();
    }

    // Temporarily skip route registration to test
    await registerRoutes(app);
    app.get("/test", (req: Request, res: Response) => res.json({ message: "Server is working", timestamp: new Date().toISOString() }));

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
