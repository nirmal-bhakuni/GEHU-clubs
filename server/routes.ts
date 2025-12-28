import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import { insertAdminSchema, insertClubSchema, insertEventSchema } from "./shared/schema";
import path from "path";
import fs from "fs";
import { Student } from "./models/Student";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (_req: Request, _file: Express.Multer.File, cb: any) {
    cb(null, uploadsDir);
  },
  filename: function (_req: Request, file: Express.Multer.File, cb: any) {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) return res.status(401).json({ error: "Unauthorized" });
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      if (!admin) return res.status(401).json({ error: "Invalid credentials" });

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      req.session.adminId = admin.id;

      res.json({
        success: true,
        admin: { id: admin.id, username: admin.username, clubId: admin.clubId }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Not authenticated" });

    const admin = await storage.getAdmin(req.session.adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    res.json({
      id: admin.id,
      username: admin.username,
      clubId: admin.clubId
    });
  });

  app.get("/api/clubs", async (req: Request, res: Response) => {
    try {
      const { search, category } = req.query;
      let clubs = await storage.getAllClubs();

      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        clubs = clubs.filter(c => c.name?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s));
      }

      if (category && typeof category === "string" && category !== "all") {
        clubs = clubs.filter(c => c.category === category);
      }

      res.json(clubs);
    } catch {
      res.status(500).json({ error: "Failed to fetch clubs" });
    }
  });

  app.get("/api/clubs/:id", async (req: Request, res: Response) => {
    try {
      const club = await storage.getClub(req.params.id);
      if (!club) return res.status(404).json({ error: "Club not found" });
      res.json(club);
    } catch {
      res.status(500).json({ error: "Failed to fetch club" });
    }
  });

  app.post("/api/clubs", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertClubSchema.parse(req.body);
      const club = await storage.createClub(data);
      res.status(201).json(club);
    } catch {
      res.status(400).json({ error: "Invalid club data" });
    }
  });

  app.patch("/api/clubs/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateClub(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Club not found" });
      res.json(updated);
    } catch {
      res.status(400).json({ error: "Failed to update club" });
    }
  });

  app.delete("/api/clubs/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteClub(req.params.id);
      if (!success) return res.status(404).json({ error: "Club not found" });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete club" });
    }
  });

  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const { clubId, search, category } = req.query;

      let events =
        clubId && typeof clubId === "string"
          ? await storage.getEventsByClub(clubId)
          : await storage.getAllEvents();

      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        events = events.filter(
          e => e.title?.toLowerCase().includes(s) || e.description?.toLowerCase().includes(s)
        );
      }

      if (category && typeof category === "string" && category !== "all") {
        events = events.filter(e => e.category === category);
      }

      res.json(events);
    } catch {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAuth, upload.single("image"), async (req: Request, res: Response) => {
    try {
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin) return res.status(401).json({ error: "Admin not found" });

      const club = await storage.getClub(admin.clubId!);
      if (!club) return res.status(400).json({ error: "Club not found" });

      const eventData = {
        ...req.body,
        clubId: admin.clubId,
        clubName: club.name,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null
      };

      const validated = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validated);

      res.status(201).json(event);
    } catch {
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.patch("/api/events/:id", requireAuth, upload.single("image"), async (req: Request, res: Response) => {
    try {
      const oldEvent = await storage.getEvent(req.params.id);
      if (!oldEvent) return res.status(404).json({ error: "Event not found" });

      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin) return res.status(401).json({ error: "Admin not found" });
      if (oldEvent.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { clubId, ...safeUpdates } = req.body;

      const updates = {
        ...safeUpdates,
        ...(req.file && { imageUrl: `/uploads/${req.file.filename}` })
      };

      const event = await storage.updateEvent(req.params.id, updates);
      res.json(event);
    } catch {
      res.status(400).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const oldEvent = await storage.getEvent(req.params.id);
      if (!oldEvent) return res.status(404).json({ error: "Event not found" });

      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin) return res.status(401).json({ error: "Admin not found" });
      if (oldEvent.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.post("/api/auth/register", requireAuth, async (req: Request, res: Response) => {
    try {
      const { username, password, clubId } = req.body;

      const existing = await storage.getAdminByUsername(username);
      if (existing) return res.status(400).json({ error: "Username already exists" });

      const hashed = await bcrypt.hash(password, 10);

      const admin = await storage.createAdmin({
        username,
        password: hashed,
        clubId
      });

      res.json({
        success: true,
        admin: { id: admin.id, username: admin.username, clubId: admin.clubId }
      });
    } catch {
      res.status(400).json({ error: "Registration failed" });
    }
  });

  app.post("/api/student/signup", async (req: Request, res: Response) => {
    try {
      const { name, email, password, enrollment, branch } = req.body;

      if (!name || !email || !password || !enrollment || !branch)
        return res.status(400).json({ error: "All fields required" });

      const exists = await Student.findOne({ email });
      if (exists) return res.status(400).json({ error: "Email already exists" });

      const hashed = await bcrypt.hash(password, 10);

      const student = await Student.create({
        name,
        email,
        password: hashed,
        enrollment,
        branch
      });

      req.session.studentId = student._id;

      res.json({
        success: true,
        student: {
          id: student._id,
          name: student.name,
          email: student.email
        }
      });
    } catch {
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/student/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const student = await Student.findOne({ email });
      if (!student) return res.status(401).json({ error: "Invalid email or password" });

      const valid = await bcrypt.compare(password, student.password);
      if (!valid) return res.status(401).json({ error: "Invalid email or password" });

      req.session.studentId = student._id;

      res.json({
        success: true,
        student: {
          id: student._id,
          name: student.name,
          email: student.email
        }
      });
    } catch {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/student/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
