import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";

import { registerRoutes } from "./routes";
import { connectDB } from "./config/db";
import { log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

(async () => {
  await connectDB();

  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    const publicPath = path.join(__dirname, "public");
    app.use(express.static(publicPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(publicPath, "index.html"));
    });
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    log(`Serving on http://${host}:${port}`);
  });
})();
