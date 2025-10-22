import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import { insertAdminSchema, insertClubSchema, insertEventSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
  }
}

import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads (disk storage)
const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to check if admin is authenticated
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      res.json({ 
        success: true, 
        admin: { 
          id: admin.id, 
          username: admin.username,
          clubId: admin.clubId 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const admin = await storage.getAdmin(req.session.adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({ 
      id: admin.id, 
      username: admin.username,
      clubId: admin.clubId 
    });
  });

  // Club routes
  app.get("/api/clubs", async (req, res) => {
    try {
      const { search, category } = req.query;
      let clubs = await storage.getAllClubs();
      
      // Apply server-side filtering
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        clubs = clubs.filter(club => 
          club.name.toLowerCase().includes(searchLower) ||
          club.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (category && typeof category === 'string' && category !== 'all') {
        clubs = clubs.filter(club => club.category === category);
      }
      
      res.json(clubs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clubs" });
    }
  });

  app.get("/api/clubs/:id", async (req, res) => {
    try {
      const club = await storage.getClub(req.params.id);
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }
      res.json(club);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch club" });
    }
  });

  app.post("/api/clubs", requireAuth, async (req, res) => {
    try {
      const validatedData = insertClubSchema.parse(req.body);
      const club = await storage.createClub(validatedData);
      res.status(201).json(club);
    } catch (error) {
      res.status(400).json({ error: "Invalid club data" });
    }
  });

  app.patch("/api/clubs/:id", requireAuth, async (req, res) => {
    try {
      const club = await storage.updateClub(req.params.id, req.body);
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }
      res.json(club);
    } catch (error) {
      res.status(400).json({ error: "Failed to update club" });
    }
  });

  app.delete("/api/clubs/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteClub(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Club not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete club" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const { clubId, search, category } = req.query;
      let events;
      
      if (clubId && typeof clubId === 'string') {
        events = await storage.getEventsByClub(clubId);
      } else {
        events = await storage.getAllEvents();
      }
      
      // Apply server-side filtering
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        events = events.filter(event => 
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (category && typeof category === 'string' && category !== 'all') {
        events = events.filter(event => event.category === category);
      }
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAuth, upload.single('image'), async (req, res) => {
    try {
      // Get admin to ensure they have a club assigned
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Admin must be assigned to a club to create events" });
      }
      
      // Force clubId to be the admin's club - ignore any clubId in request
      const eventData = {
        ...req.body,
        clubId: admin.clubId, // Force admin's club
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null
      };
      
      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.patch("/api/events/:id", requireAuth, upload.single('image'), async (req, res) => {
    try {
      // Get the existing event to check ownership
      const existingEvent = await storage.getEvent(req.params.id);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Get admin to check authorization
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Admin must be assigned to a club to modify events" });
      }
      
      if (existingEvent.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized to modify this event" });
      }
      
      // Prevent clubId reassignment - strip it from updates
      const { clubId, ...safeUpdates } = req.body;
      
      const updates = {
        ...safeUpdates,
        ...(req.file && { imageUrl: `/uploads/${req.file.filename}` })
      };
      
      const event = await storage.updateEvent(req.params.id, updates);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      // Get the existing event to check ownership
      const existingEvent = await storage.getEvent(req.params.id);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Get admin to check authorization
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Admin must be assigned to a club to delete events" });
      }
      
      if (existingEvent.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized to delete this event" });
      }
      
      const success = await storage.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Admin registration - PROTECTED: Admins can only create new admins for their own club
  // NOTE: In production, implement proper role-based access control (super-admin provisioning)
  app.post("/api/auth/register", requireAuth, async (req, res) => {
    try {
      const { username, password, clubId } = req.body;
      
      // Get the authenticated admin
      const creatorAdmin = await storage.getAdmin(req.session.adminId!);
      if (!creatorAdmin?.clubId) {
        return res.status(403).json({ error: "Admin must be assigned to a club to create new admins" });
      }
      
      // Verify the new admin is for the same club as the creator
      if (clubId !== creatorAdmin.clubId) {
        return res.status(403).json({ error: "Can only create admins for your own club" });
      }
      
      const existingAdmin = await storage.getAdminByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await storage.createAdmin({
        username,
        password: hashedPassword,
        clubId
      });

      res.status(201).json({ 
        success: true,
        admin: { 
          id: admin.id, 
          username: admin.username,
          clubId: admin.clubId
        }
      });
    } catch (error) {
      res.status(400).json({ error: "Registration failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
