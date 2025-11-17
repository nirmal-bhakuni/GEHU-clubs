// server/index.ts
import dotenv from "dotenv";
import express3 from "express";
import session from "express-session";
import path2 from "path";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
var MemStorage = class {
  constructor() {
    this.admins = /* @__PURE__ */ new Map();
    this.clubs = /* @__PURE__ */ new Map();
    this.events = /* @__PURE__ */ new Map();
    this.seedData().catch(console.error);
  }
  async seedData() {
    const techClubId = randomUUID();
    this.clubs.set(techClubId, {
      id: techClubId,
      name: "IEEE",
      description: "Building innovative solutions and learning cutting-edge technologies together through hackathons and workshops.",
      category: "Technology",
      memberCount: 125,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGCvDLx2YLXsTqnLYhQPbyv6wDRXXhNkU7ww&s",
      createdAt: /* @__PURE__ */ new Date()
    });
    const debateClubId = randomUUID();
    this.clubs.set(debateClubId, {
      id: debateClubId,
      name: "ARYAVRAT",
      description: "Sharpen your argumentation skills and engage in intellectual discourse on current affairs.",
      category: "Academic",
      memberCount: 85,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHSQ26pPoXAi8YKQZQPoLwPeETRdh9ywhCAQ&s",
      createdAt: /* @__PURE__ */ new Date()
    });
    const artClubId = randomUUID();
    this.clubs.set(artClubId, {
      id: artClubId,
      name: "PAPERTECH-GEHU",
      description: "Express yourself through various art forms including painting, sculpture, and digital art.",
      category: "Arts",
      memberCount: 95,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4okYreu0Yak1U5bjkWeSCRBUuagbLTanHg&s",
      createdAt: /* @__PURE__ */ new Date()
    });
    const businessClubId = randomUUID();
    this.clubs.set(businessClubId, {
      id: businessClubId,
      name: "Entrepreneurship Hub",
      description: "Connect with fellow entrepreneurs, develop business ideas, and learn from industry experts.",
      category: "Business",
      memberCount: 150,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkdkjI3VT0FR0WkyDb_xIOPfPpoULRDPybNA&s",
      createdAt: /* @__PURE__ */ new Date()
    });
    const scienceClubId = randomUUID();
    this.clubs.set(scienceClubId, {
      id: scienceClubId,
      name: "CODE_HUNTERS",
      description: "Discover the wonders of science through experiments, research projects, and field trips.",
      category: "Academic",
      memberCount: 110,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
      createdAt: /* @__PURE__ */ new Date()
    });
    const socialClubId = randomUUID();
    this.clubs.set(socialClubId, {
      id: socialClubId,
      name: "RANGMANCH",
      description: "Make a difference in our community through volunteer work and social initiatives.",
      category: "Social",
      memberCount: 175,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxB5o3X1zEYYTEL6XAalXWOiubGY_mrVJCvA&s",
      createdAt: /* @__PURE__ */ new Date()
    });
    const adminId = randomUUID();
    const hashedPassword = await bcrypt.hash("admin123", 10);
    this.admins.set(adminId, {
      id: adminId,
      username: "admin",
      password: hashedPassword,
      clubId: techClubId
      // Assign to Tech Club
    });
    const event1Id = randomUUID();
    this.events.set(event1Id, {
      id: event1Id,
      title: "Web Development Bootcamp",
      description: "Learn modern web development with React, Node.js, and more in this intensive 3-day bootcamp.",
      date: "November 15, 2025",
      time: "9:00 AM - 5:00 PM",
      location: "Engineering Building, Room 301",
      category: "Bootcamp",
      clubId: techClubId,
      clubName: "IEEE",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUzgijNqFpoWRSWhPKpXOqB-W2ccjhrFBeKw&s",
      createdAt: /* @__PURE__ */ new Date()
    });
    const event2Id = randomUUID();
    this.events.set(event2Id, {
      id: event2Id,
      title: "Winter Tech Fest",
      description: "Join us for a two-day technology festival featuring coding competitions, robotics showcase, and guest speakers from leading tech companies.",
      date: "December 20, 2025",
      time: "10:00 AM - 6:00 PM",
      location: "Main Auditorium",
      category: "Festival",
      clubId: techClubId,
      clubName: "IEEE",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSI9p1_QlWws8d3TwlotQjB_Itnxyb_BYoRBQ&s",
      createdAt: /* @__PURE__ */ new Date()
    });
    const event3Id = randomUUID();
    this.events.set(event3Id, {
      id: event3Id,
      title: "National Debate Championship",
      description: "Annual inter-college debate competition on contemporary social and political issues.",
      date: "January 15, 2026",
      time: "2:00 PM - 7:00 PM",
      location: "Seminar Hall",
      category: "Competition",
      clubId: debateClubId,
      clubName: "ARYAVRAT",
      imageUrl: "https://images.unsplash.com/photo-1525921429624-479b6a26d84d",
      // Debate image
      createdAt: /* @__PURE__ */ new Date()
    });
    const event4Id = randomUUID();
    this.events.set(event4Id, {
      id: event4Id,
      title: "New Year Cultural Night",
      description: "A night of music, dance, and theatrical performances showcasing student talents.",
      date: "January 5, 2026",
      time: "6:00 PM - 10:00 PM",
      location: "Open AUDI",
      category: "Cultural",
      clubId: socialClubId,
      clubName: "RANGMANCH",
      imageUrl: "https://i.ytimg.com/vi/gHfdgXWghP4/maxresdefault.jpg",
      createdAt: /* @__PURE__ */ new Date()
    });
    const event5Id = randomUUID();
    this.events.set(event5Id, {
      id: event5Id,
      title: "Winter Hackathon 2026",
      description: "24-hour coding marathon to build innovative solutions for real-world problems.",
      date: "February 1, 2026",
      time: "9:00 AM - 9:00 AM (next day)",
      location: "Computer Science Block",
      category: "Hackathon",
      clubId: scienceClubId,
      clubName: "CODE_HUNTERS",
      imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
      // Hackathon image
      createdAt: /* @__PURE__ */ new Date()
    });
  }
  // Admin operations
  async getAdmin(id) {
    return this.admins.get(id);
  }
  async getAdminByUsername(username) {
    return Array.from(this.admins.values()).find(
      (admin) => admin.username === username
    );
  }
  async createAdmin(insertAdmin) {
    const id = randomUUID();
    const admin = {
      ...insertAdmin,
      id,
      clubId: insertAdmin.clubId ?? null
    };
    this.admins.set(id, admin);
    return admin;
  }
  // Club operations
  async getAllClubs() {
    return Array.from(this.clubs.values());
  }
  async getClub(id) {
    return this.clubs.get(id);
  }
  async createClub(insertClub) {
    const id = randomUUID();
    const club = {
      ...insertClub,
      id,
      memberCount: insertClub.memberCount ?? 0,
      logoUrl: insertClub.logoUrl ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.clubs.set(id, club);
    return club;
  }
  async updateClub(id, updates) {
    const club = this.clubs.get(id);
    if (!club) return void 0;
    const updatedClub = { ...club, ...updates };
    this.clubs.set(id, updatedClub);
    return updatedClub;
  }
  async deleteClub(id) {
    return this.clubs.delete(id);
  }
  // Event operations
  async getAllEvents() {
    return Array.from(this.events.values());
  }
  async getEvent(id) {
    return this.events.get(id);
  }
  async getEventsByClub(clubId) {
    return Array.from(this.events.values()).filter(
      (event) => event.clubId === clubId
    );
  }
  async createEvent(insertEvent) {
    const id = randomUUID();
    const event = {
      ...insertEvent,
      id,
      imageUrl: insertEvent.imageUrl ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.events.set(id, event);
    return event;
  }
  async updateEvent(id, updates) {
    const event = this.events.get(id);
    if (!event) return void 0;
    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  async deleteEvent(id) {
    return this.events.delete(id);
  }
};
var storage = new MemStorage();

// server/routes.ts
import express from "express";
import bcrypt2 from "bcryptjs";
import multer from "multer";

// server/shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  clubId: varchar("club_id")
});
var clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  category: text("category").notNull(),
  clubId: varchar("club_id").notNull(),
  clubName: text("club_name").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var insertAdminSchema = createInsertSchema(admins).omit({
  id: true
});
var insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true
});
var insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true
});

// server/routes.ts
import path from "path";
import fs from "fs";
var uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
var storage_multer = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
var upload = multer({
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }
});
function requireAuth(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
async function registerRoutes(app2) {
  app2.use("/uploads", express.static(uploadsDir));
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isValid = await bcrypt2.compare(password, admin.password);
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
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
  app2.get("/api/auth/me", async (req, res) => {
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
  app2.get("/api/clubs", async (req, res) => {
    try {
      const { search, category } = req.query;
      let clubs2 = await storage.getAllClubs();
      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        clubs2 = clubs2.filter(
          (c) => c.name.toLowerCase().includes(s) || c.description.toLowerCase().includes(s)
        );
      }
      if (category && typeof category === "string" && category !== "all") {
        clubs2 = clubs2.filter((c) => c.category === category);
      }
      res.json(clubs2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clubs" });
    }
  });
  app2.get("/api/clubs/:id", async (req, res) => {
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
  app2.post("/api/clubs", requireAuth, async (req, res) => {
    try {
      const validatedData = insertClubSchema.parse(req.body);
      const club = await storage.createClub(validatedData);
      res.status(201).json(club);
    } catch (error) {
      res.status(400).json({ error: "Invalid club data" });
    }
  });
  app2.patch("/api/clubs/:id", requireAuth, async (req, res) => {
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
  app2.delete("/api/clubs/:id", requireAuth, async (req, res) => {
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
  app2.get("/api/events", async (req, res) => {
    try {
      const { clubId, search, category } = req.query;
      let events2;
      if (clubId && typeof clubId === "string") {
        events2 = await storage.getEventsByClub(clubId);
      } else {
        events2 = await storage.getAllEvents();
      }
      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        events2 = events2.filter(
          (e) => e.title.toLowerCase().includes(s) || e.description.toLowerCase().includes(s)
        );
      }
      if (category && typeof category === "string" && category !== "all") {
        events2 = events2.filter((e) => e.category === category);
      }
      res.json(events2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.get("/api/events/:id", async (req, res) => {
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
  app2.post("/api/events", requireAuth, upload.single("image"), async (req, res) => {
    try {
      const admin = await storage.getAdmin(req.session.adminId);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Admin must be assigned to a club" });
      }
      const eventData = {
        ...req.body,
        clubId: admin.clubId,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null
      };
      const validated = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validated);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });
  app2.patch("/api/events/:id", requireAuth, upload.single("image"), async (req, res) => {
    try {
      const existingEvent = await storage.getEvent(req.params.id);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      const admin = await storage.getAdmin(req.session.adminId);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Admin must be assigned to a club" });
      }
      if (existingEvent.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { clubId, ...safeUpdates } = req.body;
      const updates = {
        ...safeUpdates,
        ...req.file && { imageUrl: `/uploads/${req.file.filename}` }
      };
      const event = await storage.updateEvent(req.params.id, updates);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Failed to update event" });
    }
  });
  app2.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const existingEvent = await storage.getEvent(req.params.id);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      const admin = await storage.getAdmin(req.session.adminId);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Admin must be assigned to a club" });
      }
      if (existingEvent.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const success = await storage.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
  app2.post("/api/auth/register", requireAuth, async (req, res) => {
    try {
      const { username, password, clubId } = req.body;
      const creator = await storage.getAdmin(req.session.adminId);
      if (!creator?.clubId) {
        return res.status(403).json({ error: "Admin must be assigned to a club" });
      }
      if (clubId !== creator.clubId) {
        return res.status(403).json({ error: "Can only create admins for your club" });
      }
      const existing = await storage.getAdminByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await bcrypt2.hash(password, 10);
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/config/db.ts
import mongoose from "mongoose";
var connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn("\u26A0\uFE0F  MONGO_URI missing in .env file \u2014 skipping MongoDB connection (using in-memory storage)");
      return;
    }
    await mongoose.connect(uri);
    console.log("\u{1F680} MongoDB Connected Successfully");
  } catch (error) {
    console.error("\u274C MongoDB Error:", error.message);
    process.exit(1);
  }
};

// server/vite.ts
import express2 from "express";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/index.ts
dotenv.config();
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1e3
    }
  })
);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});
(async () => {
  await connectDB();
  const server = await registerRoutes(app);
  if (process.env.NODE_ENV === "production") {
    const publicPath = path2.join(__dirname, "public");
    app.use(express3.static(publicPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(publicPath, "index.html"));
    });
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0";
  server.listen({ port, host }, () => {
    log(`Serving on http://${host}:${port}`);
  });
})();
