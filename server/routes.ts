import type { Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import multer from "multer";
import { insertAdminSchema, insertClubSchema, insertEventSchema } from "./shared/schema";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { Student } from "./models/Student";
import { Admin } from "./models/Admin";
import { EventRegistration } from "./models/EventRegistration";
import { ClubMembership } from "./models/ClubMembership";
import { Achievement } from "./models/Achievement";
import { ClubLeadership } from "./models/ClubLeadership";
import StudentPoints from "./models/StudentPoints";
import { Club } from "./models/Club";
import { Message } from "./models/Message";
import { Announcement } from "./models/Announcement";
import { Event } from "./models/Event";
import { ClubStory } from "./models/ClubStory";
import { ChatGroup } from "./models/ChatGroup";
import { ChatMessage } from "./models/ChatMessage";
import { ChatReadState } from "./models/ChatReadState";
import { notifyAnnouncement, notifyNewEvent } from "./services/emailService";

const uploadsDirCandidates = [
  path.join(process.cwd(), "uploads"),
  path.join(process.cwd(), "..", "uploads"),
];

const uploadsDir = uploadsDirCandidates.find((candidate) => fs.existsSync(candidate)) || uploadsDirCandidates[0];
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (_req: Request, _file: any, cb: any) {
    cb(null, uploadsDir);
  },
  filename: function (_req: Request, file: any, cb: any) {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 25 * 1024 * 1024 }
});

const DEFAULT_CLUB_LOGO = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop";

function hasLocalUploadFile(uploadUrl?: string | null): boolean {
  if (!uploadUrl || typeof uploadUrl !== "string" || !uploadUrl.startsWith("/uploads/")) {
    return false;
  }

  const fileName = uploadUrl.replace("/uploads/", "");
  if (!fileName) {
    return false;
  }

  const decodedFileName = decodeURIComponent(fileName);
  return fs.existsSync(path.join(uploadsDir, decodedFileName));
}

function normalizeClubMedia<T extends { logoUrl?: string | null; coverImageUrl?: string | null }>(club: T): T {
  const next = { ...club };

  if (!next.logoUrl || (next.logoUrl.startsWith("/uploads/") && !hasLocalUploadFile(next.logoUrl))) {
    next.logoUrl = DEFAULT_CLUB_LOGO;
  }

  if (next.coverImageUrl && next.coverImageUrl.startsWith("/uploads/") && !hasLocalUploadFile(next.coverImageUrl)) {
    next.coverImageUrl = null;
  }

  return next;
}

const STORY_EXPIRY_HOURS = 24;

async function purgeExpiredStories() {
  await ClubStory.deleteMany({
    expiresAt: { $lte: new Date() },
  });
}

const fallbackClubs = [
  {
    id: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
    name: "IEEE",
    description: "Building innovative solutions...",
    category: "Technology",
    memberCount: 125,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGCvDLx2YLXsTqnLYhQPbyv6wDRXXhNkU7ww&s",
    coverImageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: "484c2b24-6193-42c1-879b-185457a9598f",
    name: "ARYAVRAT",
    description: "Sharpen your argumentation skills...",
    category: "Academic",
    memberCount: 85,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHSQ26pPoXAi8YKQZQPoLwPeETRdh9ywhCAQ&s",
    coverImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: "181d3e7d-d6cd-4f40-b712-7182fcd77154",
    name: "PAPERTECH-GEHU",
    description: "Express yourself through various art forms...",
    category: "Arts",
    memberCount: 95,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4okYreu0Yak1U5bjkWeSCRBUuagbLTanHg&s",
    coverImageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: "cc71501e-1525-4e3b-959c-f3874db96396",
    name: "Entrepreneurship Hub",
    description: "Connect with fellow entrepreneurs...",
    category: "Business",
    memberCount: 150,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkdkjI3VT0FR0WkyDb_xIOPfPpoULRDPybNA&s",
    coverImageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: "485300f0-e4cc-4116-aa49-d60dd19070d8",
    name: "CODE_HUNTERS",
    description: "Discover the wonders of science...",
    category: "Academic",
    memberCount: 110,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
    coverImageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: "ff82f1ca-01be-4bff-b0f5-8a1e44dcf951",
    name: "RANGMANCH",
    description: "Make a difference in our community...",
    category: "Social",
    memberCount: 175,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxB5o3X1zEYYTEL6XAalXWOiubGY_mrVJCvA&s",
    coverImageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
];

const fallbackEvents = [
  {
    id: randomUUID(),
    title: "Web Development Bootcamp",
    description: "Learn modern web development...",
    date: "November 15, 2025",
    time: "9:00 AM - 5:00 PM",
    location: "Engineering Building",
    category: "Bootcamp",
    clubId: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
    clubName: "IEEE",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUzgijNqFpoWRSWhPKpXOqB-W2ccjhrFBeKw&s",
    createdAt: new Date(),
  },
  {
    id: randomUUID(),
    title: "Winter Tech Fest",
    description: "Two-day technology festival...",
    date: "December 20, 2025",
    time: "10:00 AM - 6:00 PM",
    location: "Main Auditorium",
    category: "Festival",
    clubId: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
    clubName: "IEEE",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSI9p1_QlWws8d3TwlotQjB_Itnxyb_BYoRBQ&s",
    createdAt: new Date(),
  },
];

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) return res.status(401).json({ error: "Unauthorized" });
  next();
}

function requireAnyAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId && !req.session.studentId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

type ChatActor = {
  userType: "student" | "admin";
  userId: string;
  userKey: string;
  displayName: string;
  role: "student" | "club_admin" | "university_admin";
  clubId?: string;
  enrollmentNumber?: string;
};

async function resolveChatActor(req: Request): Promise<ChatActor | null> {
  // Admin should take precedence if both ids exist in session.
  if (req.session.adminId) {
    const admin = await Admin.findOne({ id: req.session.adminId });
    if (!admin) return null;

    const isUniversityAdmin = !admin.clubId;
    return {
      userType: "admin",
      userId: admin.id,
      userKey: `admin:${admin.id}`,
      displayName: String(admin.fullName || admin.username || "Admin"),
      role: isUniversityAdmin ? "university_admin" : "club_admin",
      clubId: admin.clubId || undefined,
    };
  }

  if (req.session.studentId) {
    const student = await Student.findById(req.session.studentId);
    if (!student || student.isDisabled) return null;

    return {
      userType: "student",
      userId: String(student._id),
      userKey: `student:${student.enrollment}`,
      displayName: student.name,
      role: "student",
      enrollmentNumber: student.enrollment,
    };
  }

  return null;
}

async function getAccessibleChatScope(actor: ChatActor): Promise<{ clubIds: string[]; eventIds: string[] }> {
  if (actor.role === "university_admin") {
    const [clubs, events] = await Promise.all([
      Club.find({}).select("id"),
      Event.find({}).select("id"),
    ]);

    return {
      clubIds: clubs.map((club: any) => club.id),
      eventIds: events.map((event: any) => event.id),
    };
  }

  if (actor.role === "club_admin") {
    const clubId = actor.clubId;
    if (!clubId) return { clubIds: [], eventIds: [] };

    const events = await Event.find({ clubId }).select("id");
    return {
      clubIds: [clubId],
      eventIds: events.map((event: any) => event.id),
    };
  }

  if (!actor.enrollmentNumber) return { clubIds: [], eventIds: [] };

  const [approvedMemberships, registrations] = await Promise.all([
    ClubMembership.find({
      enrollmentNumber: actor.enrollmentNumber,
      status: "approved",
    }).select("clubId"),
    EventRegistration.find({
      enrollmentNumber: actor.enrollmentNumber,
      status: { $ne: "rejected" },
    }).select("eventId"),
  ]);

  return {
    clubIds: [...new Set(approvedMemberships.map((membership: any) => membership.clubId))],
    eventIds: [...new Set(registrations.map((registration: any) => registration.eventId))],
  };
}

async function createSystemAuditMessage(params: {
  groupId: string;
  actor: ChatActor;
  action: string;
  content: string;
}) {
  await ChatMessage.create({
    id: randomUUID(),
    chatGroupId: params.groupId,
    senderType: "admin",
    senderId: params.actor.userId,
    senderName: "System",
    content: params.content,
    type: "text",
    isSystem: true,
    systemAction: params.action,
    deleted: false,
    createdAt: new Date(),
  });

  await ChatGroup.updateOne({ id: params.groupId }, { $set: { updatedAt: new Date() } });
}

// Middleware to check if student is authenticated and account is not disabled
async function requireStudentAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });
  
  try {
    const student = await Student.findById(req.session.studentId);
    if (!student) return res.status(401).json({ error: "Student not found" });
    
    if (student.isDisabled) {
      // Clear the session for disabled accounts
      req.session.destroy(() => {});
      return res.status(403).json({ error: "Account is disabled. Please contact administrator." });
    }
    
    next();
  } catch (error) {
    console.error("Student auth check error:", error);
    res.status(500).json({ error: "Authorization check failed" });
  }
}

// Middleware to check if admin owns the club they're trying to access
async function requireClubOwnership(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const admin = await storage.getAdmin(req.session.adminId);
    if (!admin) return res.status(401).json({ error: "Admin not found" });
    
    // University admins cannot access club-specific admin endpoints
    if (!admin.clubId) {
      return res.status(403).json({ error: "University admins cannot access club admin endpoints" });
    }
    
    // Get the clubId from the route params
    const clubId = req.params.clubId || req.body?.clubId;
    
    if (clubId && admin.clubId !== clubId) {
      return res.status(403).json({ error: "You do not have permission to access this club's data" });
    }
    
    // Attach admin to request for use in handlers
    (req as any).admin = admin;
    next();
  } catch (error) {
    console.error("Club ownership check error:", error);
    res.status(500).json({ error: "Authorization check failed" });
  }
}

function parseLocalDateTime(date: string, time: string): Date | null {
  const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const timeMatch = /^\d{2}:\d{2}$/.test(time);
  if (!dateMatch || !timeMatch) return null;

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLocation(location: string) {
  return location.trim().toLowerCase();
}

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parsePagination(query: Request["query"], defaults = { page: 1, limit: 50, maxLimit: 200 }) {
  const page = parsePositiveInt(query.page, defaults.page);
  const limit = Math.min(parsePositiveInt(query.limit, defaults.limit), defaults.maxLimit);
  const skip = (page - 1) * limit;
  const requested = query.page !== undefined || query.limit !== undefined;
  return { page, limit, skip, requested };
}

function escapeRegexInput(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findVenueConflict(params: {
  date: string;
  time: string;
  durationMinutes?: number;
  location: string;
  excludeEventId?: string;
}) {
  const { date, time, durationMinutes = 120, location, excludeEventId } = params;

  const requestedStart = parseLocalDateTime(date, time);
  if (!requestedStart) return { error: "Invalid event date or time format" as const };

  const requestedDuration = Number(durationMinutes);
  if (!Number.isFinite(requestedDuration) || requestedDuration < 15) {
    return { error: "Event duration must be at least 15 minutes" as const };
  }

  const normalizedLocation = normalizeLocation(location);

  const sameDateEvents = await Event.find({
    date,
    ...(excludeEventId ? { id: { $ne: excludeEventId } } : {}),
  });

  const conflictingEvent = sameDateEvents.find((existing: any) => {
    if (!existing?.location || normalizeLocation(existing.location) !== normalizedLocation) {
      return false;
    }

    const existingStart = parseLocalDateTime(existing.date, existing.time);
    if (!existingStart) {
      return String(existing.time || "").trim() === String(time || "").trim();
    }

    return existingStart.getTime() === requestedStart.getTime();
  });

  return { conflict: conflictingEvent };
}

export async function registerRoutes(app: ReturnType<typeof express>): Promise<void> {
  app.use("/uploads", express.static(uploadsDir));

  // Serve static files from the client build
  const distPathCandidates = [
    path.join(process.cwd(), "dist"),
    path.join(process.cwd(), "..", "dist"),
  ];
  const distPath = distPathCandidates.find((candidate) => fs.existsSync(candidate)) || distPathCandidates[0];
  app.use(express.static(distPath));

  // General file upload endpoint
  app.post("/api/upload", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.post("/api/chat/upload", requireAnyAuth, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const groupId = String(req.body?.groupId || "").trim();
      if (!groupId) {
        return res.status(400).json({ error: "groupId is required for chat uploads" });
      }

      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      if (group.isFrozen) {
        return res.status(403).json({ error: "This chat group is frozen and no messages can be sent" });
      }

      const canAccess = await canAccessChatGroup(actor, group);
      if (!canAccess) return res.status(403).json({ error: "Access denied" });

      if (actor.userType !== "admin") {
        if (group.adminOnlyMessaging) {
          return res.status(403).json({ error: "Only admins can send attachments in this chat" });
        }

        if (Array.isArray(group.blockedUserKeys) && group.blockedUserKeys.includes(actor.userKey)) {
          return res.status(403).json({ error: "You are restricted from sending attachments in this chat" });
        }
      }

      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        url: fileUrl,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
      });
    } catch {
      res.status(500).json({ error: "Failed to upload chat attachment" });
    }
  });

  app.get("/api/stories/highlights", async (_req: Request, res: Response) => {
    try {
      await purgeExpiredStories();

      const stories = await ClubStory.find({
        isHighlight: true,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      }).sort({ createdAt: -1 });
      const clubs = await Club.find({ isFrozen: { $ne: true } }).select("id name logoUrl");
      const clubMap = new Map(clubs.map((club: any) => [club.id, club]));

      const seenClubs = new Set<string>();
      const highlights = stories
        .filter((story: any) => {
          if (!clubMap.has(story.clubId)) return false;
          if (seenClubs.has(story.clubId)) return false;
          seenClubs.add(story.clubId);
          return true;
        })
        .map((story: any) => {
          const club = clubMap.get(story.clubId);
          return {
            id: story.id,
            clubId: story.clubId,
            clubName: story.clubName,
            clubLogo: club?.logoUrl || "",
            mediaUrl: story.mediaUrl,
            mediaType: story.mediaType || (story.mediaUrl ? "image" : "text"),
            caption: story.caption || "",
            isHighlight: !!story.isHighlight,
            createdAt: story.createdAt,
          };
        });

      res.json(highlights);
    } catch {
      res.status(500).json({ error: "Failed to fetch story highlights" });
    }
  });

  app.get("/api/admin/stories/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Only club admins can manage stories" });
      }

      await purgeExpiredStories();

      const stories = await ClubStory.find({
        clubId: admin.clubId,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      }).sort({ createdAt: -1 });
      res.json(stories);
    } catch {
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.post("/api/admin/stories", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Only club admins can create stories" });
      }

      const club = await Club.findOne({ id: admin.clubId });
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }

      const mediaUrl = String(req.body?.mediaUrl || "").trim();
      const mediaType = String(req.body?.mediaType || (mediaUrl ? "image" : "text")).trim();
      const caption = String(req.body?.caption || "").trim();
      const isHighlight = !!req.body?.isHighlight;

      if (!mediaUrl && !caption) {
        return res.status(400).json({ error: "Story text or media is required" });
      }

      if (!["image", "video", "text"].includes(mediaType)) {
        return res.status(400).json({ error: "Invalid media type" });
      }

      if (mediaType !== "text" && !mediaUrl) {
        return res.status(400).json({ error: "mediaUrl is required for image or video stories" });
      }

      const story = await ClubStory.create({
        id: randomUUID(),
        clubId: admin.clubId,
        clubName: club.name,
        mediaUrl,
        mediaType,
        caption,
        isHighlight,
        expiresAt: new Date(Date.now() + STORY_EXPIRY_HOURS * 60 * 60 * 1000),
        createdByAdminId: admin.id,
        createdAt: new Date(),
      });

      res.status(201).json(story);
    } catch {
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  app.patch("/api/admin/stories/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Only club admins can update stories" });
      }

      await purgeExpiredStories();

      const story = await ClubStory.findOne({ id: req.params.id, clubId: admin.clubId });
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      if (typeof req.body?.isHighlight === "boolean") {
        story.isHighlight = req.body.isHighlight;
      }
      if (typeof req.body?.caption === "string") {
        story.caption = req.body.caption.trim();
      }

      await story.save();
      res.json(story);
    } catch {
      res.status(500).json({ error: "Failed to update story" });
    }
  });

  app.delete("/api/admin/stories/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin?.clubId) {
        return res.status(403).json({ error: "Only club admins can delete stories" });
      }

      await purgeExpiredStories();

      const deleted = await ClubStory.findOneAndDelete({ id: req.params.id, clubId: admin.clubId });
      if (!deleted) {
        return res.status(404).json({ error: "Story not found" });
      }

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete story" });
    }
  });

  // University admin login - clubId must be null
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      if (!admin) return res.status(401).json({ error: "Invalid credentials" });

      // Ensure this is a university admin (no clubId)
      if (admin.clubId) {
        return res.status(403).json({ error: "Club admins must use the club admin login" });
      }

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      // Update last login
      await Admin.findOneAndUpdate({ id: admin.id }, { lastLogin: new Date() });

      // Ensure session represents admin context only.
      req.session.studentId = undefined;
      req.session.adminId = admin.id;
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        res.json({
          success: true,
          admin: { id: admin.id, username: admin.username, clubId: admin.clubId }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Club admin login - clubId must not be null
  app.post("/api/auth/club-login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      if (!admin) return res.status(401).json({ error: "Invalid credentials" });

      // Ensure this is a club admin (has clubId)
      if (!admin.clubId) {
        return res.status(403).json({ error: "University admins must use the university admin login" });
      }

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      // Update last login
      await Admin.findOneAndUpdate({ id: admin.id }, { lastLogin: new Date() });

      // Ensure session represents admin context only.
      req.session.studentId = undefined;
      req.session.adminId = admin.id;
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        res.json({
          success: true,
          admin: { id: admin.id, username: admin.username, clubId: admin.clubId }
        });
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

    const { Admin } = await import("./models/Admin.js");
    const admin = await Admin.findOne({ id: req.session.adminId });
    
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    res.json({
      id: admin.id,
      username: admin.username,
      clubId: admin.clubId,
      fullName: admin.fullName,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      permissions: admin.permissions,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    });
  });

  // Update admin profile
  app.patch("/api/admin/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const { fullName, email, phone } = req.body;
      
      const { Admin } = await import("./models/Admin.js");
      const admin = await Admin.findOne({ id: req.session.adminId });
      
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Update fields if provided
      if (fullName !== undefined) admin.fullName = fullName;
      if (email !== undefined) admin.email = email;
      if (phone !== undefined) admin.phone = phone;

      await admin.save();

      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          clubId: admin.clubId,
          fullName: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          permissions: admin.permissions,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      });
    } catch (error) {
      console.error("Error updating admin profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/clubs", async (req: Request, res: Response) => {
    try {
      const { search, category } = req.query;
      let clubs = await storage.getAllClubs();

      if (!Array.isArray(clubs) || clubs.length === 0) {
        clubs = fallbackClubs as any;
      }

      // Fetch all club memberships once for efficiency
      const { ClubMembership } = await import("./models/ClubMembership.js");
      const allMemberships = await ClubMembership.find({ status: { $ne: 'rejected' } });
      
      // Create a map of clubId -> member count
      const memberCountMap = new Map<string, number>();
      allMemberships.forEach(membership => {
        const current = memberCountMap.get(membership.clubId) || 0;
        memberCountMap.set(membership.clubId, current + 1);
      });

      // Add actual member counts to clubs
      const clubsWithMemberCounts = clubs.map((club) => {
        const clubObj = club.toObject ? club.toObject() : club;
        // Use actual membership count if available, otherwise use club's existing memberCount
        const actualCount = memberCountMap.get(club.id);
        return normalizeClubMedia({
          ...clubObj,
          memberCount: actualCount !== undefined ? actualCount : (clubObj.memberCount || 0)
        });
      });

      let filteredClubs = clubsWithMemberCounts;

      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        filteredClubs = filteredClubs.filter(c => c.name?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s));
      }

      if (category && typeof category === "string" && category !== "all") {
        filteredClubs = filteredClubs.filter(c => c.category === category);
      }

      res.json(filteredClubs);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      res.json(fallbackClubs);
    }
  });

  app.get("/api/clubs/:id", async (req: Request, res: Response) => {
    try {
      const club = await storage.getClub(req.params.id);
      if (!club) return res.status(404).json({ error: "Club not found" });
      
      // Get actual member count from club memberships
      const actualMemberCount = await storage.getClubMemberCount(club.id);
      const clubObj = club.toObject ? club.toObject() : club;
      
      res.json(normalizeClubMedia({
        ...clubObj,
        memberCount: actualMemberCount
      }));
    } catch (error) {
      console.error("Error fetching club:", error);
      res.status(500).json({ error: "Failed to fetch club" });
    }
  });

  app.post("/api/clubs", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertClubSchema.parse(req.body);
      const club = await storage.createClub(data);

      // Ensure every newly created club has a default chat group.
      const admin = await storage.getAdmin(req.session.adminId!);
      const existingGroup = await ChatGroup.findOne({ type: "club", clubId: club.id });
      if (!existingGroup) {
        await ChatGroup.create({
          id: randomUUID(),
          name: `${club.name} Club Chat`,
          type: "club",
          clubId: club.id,
          createdByType: "admin",
          createdById: admin?.id || req.session.adminId!,
        });
      }

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

  app.patch("/api/clubs/:id/freeze", requireAuth, async (req: Request, res: Response) => {
    try {
      const { freeze } = req.body;
      const admin = await storage.getAdmin(req.session.adminId!);
      
      const updated = await storage.updateClub(req.params.id, {
        isFrozen: freeze,
        frozenAt: freeze ? new Date() : null,
        frozenBy: freeze ? admin?.username : null,
      });
      
      if (!updated) return res.status(404).json({ error: "Club not found" });
      
      // Also freeze the club's chat group when freezing the club
      await ChatGroup.updateMany(
        { clubId: req.params.id },
        {
          $set: {
            isFrozen: freeze,
            frozenAt: freeze ? new Date() : null,
            frozenBy: freeze ? admin?.username : null,
          }
        }
      );
      
      res.json(updated);
    } catch (error) {
      console.error("Freeze club error:", error);
      res.status(400).json({ error: "Failed to update club freeze status" });
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

  // Public Achievements Routes
  app.get("/api/achievements/:clubId", async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const achievements = await storage.getAchievementsByClub(clubId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const { clubId, search, category } = req.query;

      let events =
        clubId && typeof clubId === "string"
          ? await storage.getEventsByClub(clubId)
          : await storage.getAllEvents();

      if (!Array.isArray(events) || events.length === 0) {
        events = fallbackEvents as any;
      }

      if (search && typeof search === "string") {
        const s = search.toLowerCase();
        events = events.filter(
          e => e.title?.toLowerCase().includes(s) || e.description?.toLowerCase().includes(s)
        );
      }

      if (category && typeof category === "string" && category !== "all") {
        events = events.filter(e => e.category === category);
      }

      // Ensure all events have an id field
      const eventsWithId = events.map(e => {
        const eventObj = e.toObject ? e.toObject() : e;
        return {
          ...eventObj,
          id: eventObj.id || eventObj._id?.toString() // Use id if present, fallback to _id
        };
      });

      res.json(eventsWithId);
    } catch {
      res.json(fallbackEvents);
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      
      // Ensure the event object includes an id field
      const eventObj = event.toObject ? event.toObject() : event;
      const responseEvent = {
        ...eventObj,
        id: eventObj.id || eventObj._id?.toString()
      };
      
      res.json(responseEvent);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAuth, upload.fields([{ name: "imageFile", maxCount: 1 }, { name: "image", maxCount: 1 }]), async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) return res.status(401).json({ error: "Unauthorized" });
      
      const admin = await storage.getAdmin(req.session.adminId);
      if (!admin) return res.status(401).json({ error: "Admin not found" });

      // If club admin, use their clubId. If university admin, use the provided clubId from request
      const clubId = admin.clubId || req.body.clubId;
      if (!clubId) return res.status(400).json({ error: "Club ID is required" });

      const club = await storage.getClub(clubId);
      if (!club) return res.status(400).json({ error: "Club not found" });

      const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedImage = uploadedFiles?.imageFile?.[0] || uploadedFiles?.image?.[0];

      const eventData = {
        ...req.body,
        clubId: clubId,
        clubName: club.name,
        durationMinutes: req.body.durationMinutes,
        imageUrl: uploadedImage ? `/uploads/${uploadedImage.filename}` : null
      };

      const validated = insertEventSchema.parse(eventData);

      const conflictCheck = await findVenueConflict({
        date: validated.date,
        time: validated.time,
        durationMinutes: validated.durationMinutes,
        location: validated.location,
      });

      if ("error" in conflictCheck) {
        return res.status(400).json({ error: conflictCheck.error });
      }

      if (conflictCheck.conflict) {
        return res.status(409).json({
          error: `Venue conflict: "${conflictCheck.conflict.title}" is already scheduled at ${conflictCheck.conflict.location} on ${conflictCheck.conflict.date} ${conflictCheck.conflict.time}. Same venue and same time are not allowed.`,
        });
      }

      const event = await storage.createEvent(validated);

      res.status(201).json(event);

      void notifyNewEvent(event)
        .then(async () => {
          await Event.findOneAndUpdate({ id: event.id }, { createdEmailSentAt: new Date() });
        })
        .catch((error) => {
          console.error("Failed to send new event emails:", error);
        });
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid event data" });
      }
    }
  });

  app.patch("/api/events/:id", requireAuth, upload.fields([{ name: "imageFile", maxCount: 1 }, { name: "image", maxCount: 1 }]), async (req: Request, res: Response) => {
    try {
      const oldEvent = await storage.getEvent(req.params.id);
      if (!oldEvent) return res.status(404).json({ error: "Event not found" });

      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin) return res.status(401).json({ error: "Admin not found" });
      
      // Allow university admins (clubId: null) to edit any event, or club admins to edit their own
      if (admin.clubId && oldEvent.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { clubId, ...safeUpdates } = req.body;

      const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedImage = uploadedFiles?.imageFile?.[0] || uploadedFiles?.image?.[0];

      const updates = {
        ...safeUpdates,
        ...(uploadedImage && { imageUrl: `/uploads/${uploadedImage.filename}` })
      };

      const nextDate = updates.date ?? oldEvent.date;
      const nextTime = updates.time ?? oldEvent.time;
      const nextLocation = updates.location ?? oldEvent.location;
      const nextDurationMinutes =
        updates.durationMinutes !== undefined
          ? Number(updates.durationMinutes)
          : Number(oldEvent.durationMinutes ?? 120);

      const conflictCheck = await findVenueConflict({
        date: nextDate,
        time: nextTime,
        durationMinutes: nextDurationMinutes,
        location: nextLocation,
        excludeEventId: oldEvent.id,
      });

      if ("error" in conflictCheck) {
        return res.status(400).json({ error: conflictCheck.error });
      }

      if (conflictCheck.conflict) {
        return res.status(409).json({
          error: `Venue conflict: "${conflictCheck.conflict.title}" is already scheduled at ${conflictCheck.conflict.location} on ${conflictCheck.conflict.date} ${conflictCheck.conflict.time}. Same venue and same time are not allowed.`,
        });
      }

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
      
      // Allow university admins (clubId: null) to delete any event, or club admins to delete their own
      if (admin.clubId && oldEvent.clubId !== admin.clubId) {
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
      const { name, email, phone, rollNumber, password, enrollment, department, yearOfAdmission } = req.body;

      if (!name || !email || !password || !enrollment || !department)
        return res.status(400).json({ error: "All fields required" });

      const exists = await Student.findOne({ email });
      if (exists) return res.status(400).json({ error: "Email already exists" });

      const enrollmentExists = await Student.findOne({ enrollment });
      if (enrollmentExists) return res.status(400).json({ error: "Enrollment number already registered. Please login instead or contact the administrator." });

      // Check for duplicate roll number if provided
      if (rollNumber) {
        const rollNumberExists = await Student.findOne({ rollNumber });
        if (rollNumberExists) return res.status(400).json({ error: "Roll number already registered with another account. Please use a different roll number or contact the administrator." });
      }

      const hashed = await bcrypt.hash(password, 10);

      const student = await Student.create({
        name,
        email,
        phone: phone || "",
        rollNumber: rollNumber || "",
        password: hashed,
        enrollment,
        department: department || "",
        yearOfAdmission: yearOfAdmission || new Date().getFullYear(),
        lastLogin: new Date()
      });

      req.session.studentId = student._id.toString();
      req.session.studentEmail = student.email;

      // Calculate current year of course
      const currentYear = new Date().getFullYear();
      const yearOfCourse = currentYear - (student.yearOfAdmission || currentYear) + 1;

      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Signup failed - session error" });
        }

        res.json({
          success: true,
          student: {
            id: student._id.toString(),
            name: student.name,
            email: student.email,
            phone: student.phone,
            rollNumber: student.rollNumber,
            enrollment: student.enrollment,
            department: student.department,
            yearOfAdmission: student.yearOfAdmission,
            yearOfCourse,
            lastLogin: student.lastLogin
          }
        });
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      // Handle mongoose duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        if (field === "rollNumber") {
          return res.status(400).json({ error: "Roll number already registered with another account. Please use a different roll number or contact the administrator." });
        } else if (field === "enrollment") {
          return res.status(400).json({ error: "Enrollment number already registered. Please login instead or contact the administrator." });
        }
      }
      res.status(500).json({ error: "Signup failed" });
    }
  });

  // Announcements: create (admin) and list (public)
  app.post("/api/announcements", requireAuth, async (req: Request, res: Response) => {
    try {
      const { title, content, target } = req.body;
      if (!title || !content) return res.status(400).json({ error: "Title and content required" });

      const admin = await Admin.findOne({ id: req.session.adminId });
      const announcement = await storage.createAnnouncement({
        title,
        content,
        authorId: admin?.id || "",
        authorName: admin?.username || "System",
        target: target || "all",
      });

      res.status(201).json({ success: true, announcement });

      if (admin && !admin.clubId) {
        void notifyAnnouncement(announcement).catch((error) => {
          console.error("Failed to send announcement emails:", error);
        });
      }
    } catch (error) {
      console.error("Failed to create announcement:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  app.get("/api/announcements", async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit || 20);
      const announcements = await storage.getAnnouncements(limit);
      res.json(announcements);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  // Admin: pin/unpin announcement
  app.patch("/api/announcements/:id/pin", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { pinned } = req.body;
      const updated = await storage.pinAnnouncement(id, !!pinned);
      res.json({ success: true, announcement: updated });
    } catch (error) {
      console.error("Failed to pin announcement:", error);
      res.status(500).json({ error: "Failed to pin announcement" });
    }
  });

  // Admin: delete announcement
  app.delete("/api/announcements/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteAnnouncement(id);
      if (!ok) return res.status(404).json({ error: "Announcement not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // Admin: edit announcement
  app.patch("/api/announcements/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, content, target, pinned } = req.body;
      const updated = await storage.updateAnnouncement(id, { title, content, target, pinned });
      if (!updated) return res.status(404).json({ error: "Announcement not found" });
      res.json({ success: true, announcement: updated });
    } catch (error) {
      console.error("Failed to update announcement:", error);
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });

  // Student: get announcements with read flag
  app.get("/api/student/announcements", requireStudentAuth, async (req: Request, res: Response) => {
    try {
      const student = await Student.findById(req.session.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });
      const announcements = await storage.getAnnouncementsForStudent(student.enrollment);
      res.json(announcements);
    } catch (error) {
      console.error("Failed to fetch student announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  // Student: mark announcement as read
  app.post("/api/student/announcements/:id/read", requireStudentAuth, async (req: Request, res: Response) => {
    try {
      const student = await Student.findById(req.session.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });
      const { id } = req.params;
      const read = await storage.markAnnouncementRead(id, student.enrollment);
      res.json({ success: true, read });
    } catch (error) {
      console.error("Failed to mark announcement read:", error);
      res.status(500).json({ error: "Failed to mark read" });
    }
  });

  app.post("/api/student/login", async (req: Request, res: Response) => {
    try {
      const { enrollment, password } = req.body;

      const student = await Student.findOne({ enrollment });
      if (!student) return res.status(401).json({ error: "Invalid enrollment or password" });

      // Check if account is disabled
      if (student.isDisabled) {
        return res.status(403).json({ error: "Account is disabled. Please contact administrator." });
      }

      const valid = await bcrypt.compare(password, student.password);
      if (!valid) return res.status(401).json({ error: "Invalid enrollment or password" });

      // update lastLogin timestamp
      student.lastLogin = new Date();
      await student.save();

      // Calculate current year of course based on admission year
      const currentYear = new Date().getFullYear();
      const yearOfCourse = student.yearOfAdmission ? currentYear - student.yearOfAdmission + 1 : 1;

      // Ensure session represents student context only.
      req.session.adminId = undefined;
      req.session.studentId = student._id.toString();
      req.session.studentEmail = student.email;

      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed" });
        }

        res.json({
          success: true,
          student: {
            id: student._id.toString(),
            name: student.name,
            email: student.email,
            phone: student.phone,
            rollNumber: student.rollNumber,
            enrollment: student.enrollment,
            department: student.department,
            yearOfAdmission: student.yearOfAdmission,
            yearOfCourse,
            lastLogin: student.lastLogin
          }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/student/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/student/me", requireStudentAuth, async (req: Request, res: Response) => {
    const student = await Student.findById(req.session.studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Calculate current year of course based on admission year
    const currentYear = new Date().getFullYear();
    const yearOfCourse = student.yearOfAdmission ? currentYear - student.yearOfAdmission + 1 : 1;

    res.json({
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      phone: student.phone,
      rollNumber: student.rollNumber,
      enrollment: student.enrollment,
      department: student.department,
      yearOfAdmission: student.yearOfAdmission,
      yearOfCourse,
      profilePicture: student.profilePicture || null
    });
  });

  app.patch("/api/student/me", requireStudentAuth, async (req: Request, res: Response) => {
    try {
      const student = await Student.findById(req.session.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const { phone, department, yearOfAdmission, rollNumber } = req.body as {
        phone?: string;
        department?: string;
        yearOfAdmission?: number;
        rollNumber?: string;
      };

      if (typeof phone === "string") {
        student.phone = phone.trim();
      }

      if (typeof department === "string") {
        student.department = department.trim();
      }

      if (typeof rollNumber === "string") {
        student.rollNumber = rollNumber.trim();
      }

      if (typeof yearOfAdmission === "number") {
        const currentYear = new Date().getFullYear();
        const normalizedYear = Math.floor(yearOfAdmission);
        if (normalizedYear < 2000 || normalizedYear > currentYear + 1) {
          return res.status(400).json({ error: "Invalid admission year" });
        }
        student.yearOfAdmission = normalizedYear;
      }

      await student.save();

      const currentYear = new Date().getFullYear();
      const yearOfCourse = student.yearOfAdmission ? currentYear - student.yearOfAdmission + 1 : 1;

      res.json({
        success: true,
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          phone: student.phone,
          rollNumber: student.rollNumber,
          enrollment: student.enrollment,
          department: student.department,
          yearOfAdmission: student.yearOfAdmission,
          yearOfCourse,
          profilePicture: student.profilePicture || null,
        },
      });
    } catch (error) {
      console.error("Failed to update student profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Student: Upload profile picture
  app.post("/api/student/profile-picture", requireStudentAuth, upload.single("profilePicture"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      if (!req.session.studentId) return res.status(401).json({ error: "Student not authenticated" });

      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Update student profile with image URL and verify update
      const updatedStudent = await Student.findByIdAndUpdate(
        req.session.studentId,
        { profilePicture: imageUrl },
        { new: true }
      );

      if (!updatedStudent) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json({ 
        success: true, 
        imageUrl,
        profilePicture: imageUrl,
        message: "Profile picture uploaded successfully" 
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  });

  // Student: Get certificates
  app.get("/api/student/certificates", requireStudentAuth, async (req: Request, res: Response) => {
    try {

      const student = await Student.findById(req.session.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      // Get certificates for this student
      // For now, return an empty array - this will be populated when admin uploads certificates
      const certificates = student.certificates || [];

      res.json(certificates);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  });

  app.get("/api/students/count", requireAuth, async (req: Request, res: Response) => {
    try {
      const count = await Student.countDocuments();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get student count" });
    }
  });

  // Admin: Upload certificate for student
  app.post("/api/admin/upload-certificate", upload.single("certificate"), async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated as admin
      if (!req.session.adminId) {
        console.error("Unauthorized: No admin session");
        return res.status(401).json({ error: "Unauthorized: Admin login required" });
      }

      console.log("Certificate upload request:", {
        file: req.file ? { filename: req.file.filename, size: req.file.size } : "no file",
        body: req.body,
        adminId: req.session.adminId
      });

      if (!req.file) {
        console.error("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const { title, studentId, clubId, clubName } = req.body;
      
      if (!title || !studentId) {
        console.error("Missing required fields:", { title, studentId });
        return res.status(400).json({ error: "Missing required fields: title and studentId" });
      }

      const certificateUrl = `/uploads/${req.file.filename}`;
      
      console.log("Searching for student:", studentId);
      
      // Find student by ID or enrollment number
      // Check if studentId is a valid ObjectId format first
      let student;
      if (mongoose.Types.ObjectId.isValid(studentId) && studentId.length === 24) {
        // Try to find by ObjectId
        student = await Student.findById(studentId);
      }
      
      // If not found by ID, try by enrollment number
      if (!student) {
        student = await Student.findOne({ enrollment: studentId });
      }
      
      if (!student) {
        console.error("Student not found:", studentId);
        return res.status(404).json({ error: `Student not found with ID or enrollment: ${studentId}` });
      }

      console.log("Student found:", { id: student._id, name: student.name, enrollment: student.enrollment });

      // Add certificate to student's certificates array
      const certificate = {
        title,
        issuedBy: clubName || "Club",
        issuedDate: new Date(),
        certificateUrl
      };

      await Student.findByIdAndUpdate(student._id, {
        $push: { certificates: certificate }
      });

      console.log("Certificate added successfully");

      res.json({ 
        success: true, 
        certificate,
        message: "Certificate uploaded successfully" 
      });
    } catch (error) {
      console.error("Certificate upload error:", error);
      res.status(500).json({ error: "Failed to upload certificate: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  // Admin: list all students for user management
  // Return all students (not only those who have logged in) so university admins can manage users
  app.get("/api/admin/students", requireAuth, async (req: Request, res: Response) => {
    try {
      // Return all students, sorted by creation date (newest first)
      const students = await Student.find({}).sort({ createdAt: -1 });
      const payload = students.map(s => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        phone: s.phone || "",
        enrollment: s.enrollment,
        department: s.department || "",
        branch: s.department || "",
        lastLogin: s.lastLogin || null,
        isDisabled: s.isDisabled,
        createdAt: s.createdAt
      }));
      res.json(payload);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Admin: toggle student account status (enable/disable)
  app.patch("/api/admin/students/:id/toggle-status", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const student = await Student.findById(id);
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Toggle the isDisabled status
      student.isDisabled = !student.isDisabled;
      await student.save();

      res.json({
        success: true,
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          enrollment: student.enrollment,
          isDisabled: student.isDisabled
        }
      });
    } catch (error) {
      console.error("Failed to toggle student status:", error);
      res.status(500).json({ error: "Failed to toggle student status" });
    }
  });

  // Admin: get student memberships by enrollment
  app.get("/api/admin/student-memberships/:enrollment", requireAuth, async (req: Request, res: Response) => {
    try {
      const { enrollment } = req.params;
      const memberships = await storage.getClubMembershipsByStudent(enrollment);
      res.json(memberships);
    } catch (error) {
      console.error("Failed to fetch student memberships:", error);
      res.status(500).json({ error: "Failed to fetch student memberships" });
    }
  });

  // Admin: get student event registrations by enrollment
  app.get("/api/admin/student-registrations/:enrollment", requireAuth, async (req: Request, res: Response) => {
    try {
      const { enrollment } = req.params;
      const registrations = await EventRegistration.find({ enrollmentNumber: enrollment }).sort({ registeredAt: -1 });
      res.json(registrations);
    } catch (error) {
      console.error("Failed to fetch student registrations:", error);
      res.status(500).json({ error: "Failed to fetch student registrations" });
    }
  });

  // Admin: get admin details by club ID
  app.get("/api/admin/club-admin/:clubId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const admin = await Admin.findOne({ clubId });
      if (!admin) return res.status(404).json({ error: "Admin not found" });

      // Get additional statistics
      const eventsCount = await storage.getAllEvents().then(events => events.filter(e => e.clubId === clubId).length);
      const membershipsCount = await storage.getClubMembershipsByClub(clubId).then(memberships => memberships.length);
      const recentEvents = await storage.getAllEvents().then(events =>
        events.filter(e => e.clubId === clubId)
          .sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime())
          .slice(0, 5)
      );

      res.json({
        id: admin.id,
        username: admin.username,
        email: admin.email || "",
        fullName: admin.fullName || "",
        phone: admin.phone || "",
        clubId: admin.clubId,
        lastLogin: admin.lastLogin,
        isActive: admin.isActive,
        role: admin.role,
        permissions: admin.permissions,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        statistics: {
          totalEvents: eventsCount,
          totalMembers: membershipsCount,
          recentEvents: recentEvents.map(event => ({
            id: event.id,
            title: event.title,
            date: event.date,
            status: new Date(event.date || new Date()) > new Date() ? 'upcoming' : 'past'
          }))
        }
      });
    } catch (error) {
      console.error("Failed to fetch admin:", error);
      res.status(500).json({ error: "Failed to fetch admin" });
    }
  });

  // Admin: reset admin password
  app.patch("/api/admin/reset-admin-password/:clubId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const admin = await Admin.findOne({ clubId });
      if (!admin) return res.status(404).json({ error: "Admin not found" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedPassword;
      await admin.save();

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Failed to reset admin password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  // Event Registration Routes
  app.post("/api/events/:eventId/register", async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const registrationData = req.body;

      // Get event details
      const event = await storage.getEvent(eventId);
      if (!event) return res.status(404).json({ error: "Event not found" });

      // Check if student has already registered for this event
      const existingRegistration = await EventRegistration.findOne({
        enrollmentNumber: registrationData.enrollmentNumber,
        eventId: eventId
      });

      if (existingRegistration) {
        return res.status(400).json({ error: "You have already registered for this event" });
      }

      // Create registration with event details
      const registration = await storage.createEventRegistration({
        ...registrationData,
        eventId,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        clubName: event.clubName,
        status: 'pending',
      });

        // Automatically create a membership request for the club
        // Check if student doesn't already have a membership for this club
        const existingMembership = await ClubMembership.findOne({
          enrollmentNumber: registrationData.enrollmentNumber,
          clubId: event.clubId
        });

        if (!existingMembership) {
          // Create a pending membership request
          await storage.createClubMembership({
            studentName: registrationData.fullName || registrationData.studentName,
            studentEmail: registrationData.email || registrationData.studentEmail,
            enrollmentNumber: registrationData.enrollmentNumber,
            department: registrationData.department,
            reason: `Registered for event: ${event.title}`,
            clubId: event.clubId,
            clubName: event.clubName,
            status: 'pending'
          });
        }

        res.json({ success: true, registration });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register for event" });
    }
  });

  app.get("/api/student/registrations", requireStudentAuth, async (req: Request, res: Response) => {
    try {
      const student = await Student.findById(req.session.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const registrations = await storage.getEventRegistrationsByStudent(student.enrollment);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Event Feedback Routes
  app.post("/api/events/:eventId/feedback", async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { rating, comment } = req.body;

      // Validate input
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      // Get event details
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Create feedback record (you might want to create a proper Feedback model)
      // For now, we'll just return success
      console.log("Event feedback received:", {
        eventId,
        eventTitle: event.title,
        rating,
        comment,
        submittedAt: new Date()
      });

      res.status(201).json({
        message: "Feedback submitted successfully",
        feedback: {
          eventId,
          rating,
          comment,
          submittedAt: new Date()
        }
      });
    } catch (error) {
      console.error("Feedback submission error:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Message Routes
  app.post("/api/clubs/:clubId/messages", async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const { senderName, senderEmail, enrollmentNumber, subject, message: messageContent } = req.body;

      // Validate input
      if (!senderName || !senderEmail || !enrollmentNumber || !subject || !messageContent) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Get club details
      const club = await storage.getClub(clubId);
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }

      // Create message
      const message = new Message({
        id: Date.now().toString(),
        clubId,
        senderName,
        senderEmail,
        enrollmentNumber,
        subject,
        message: messageContent,
        sentAt: new Date(),
        read: false
      });

      await message.save();

      res.status(201).json({
        message: "Message sent successfully",
        messageId: message.id
      });
    } catch (error) {
      console.error("Message submission error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/clubs/:clubId/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;

      // Check if admin has access to this club
      if (req.session.adminId) {
        const admin = await Admin.findOne({ id: req.session.adminId });
        if (!admin || admin.clubId !== clubId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const messages = await Message.find({ clubId }).sort({ sentAt: -1 });
      res.json(messages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.put("/api/messages/:messageId/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;

      const message = await Message.findOne({ id: messageId });
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if admin has access to this club's messages
      if (req.session.adminId) {
        const admin = await Admin.findOne({ id: req.session.adminId });
        if (!admin || admin.clubId !== message.clubId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      message.read = true;
      await message.save();

      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Failed to mark message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  async function getScopedChatGroups(actor: ChatActor) {
    const scope = await getAccessibleChatScope(actor);

    if (actor.role === "student" && scope.clubIds.length > 0) {
      const existingClubGroups = await ChatGroup.find({
        type: "club",
        clubId: { $in: scope.clubIds },
      }).select("clubId");

      const existingClubIds = new Set(
        existingClubGroups
          .map((group: any) => group.clubId)
          .filter((clubId: any): clubId is string => typeof clubId === "string" && clubId.length > 0)
      );

      const missingClubIds = scope.clubIds.filter((clubId) => !existingClubIds.has(clubId));

      if (missingClubIds.length > 0) {
        const clubs = await Club.find({ id: { $in: missingClubIds } }).select("id name");

        await Promise.all(
          clubs.map(async (club: any) => {
            const alreadyExists = await ChatGroup.findOne({ type: "club", clubId: club.id }).select("id");
            if (alreadyExists) return;

            await ChatGroup.create({
              id: randomUUID(),
              name: `${club.name} Club Chat`,
              type: "club",
              clubId: club.id,
              createdByType: "admin",
              createdById: "system:auto",
            });
          })
        );
      }
    }

    if ((actor.role === "student" || actor.role === "club_admin") && scope.eventIds.length > 0) {
      const existingEventGroups = await ChatGroup.find({
        type: "event",
        eventId: { $in: scope.eventIds },
      }).select("eventId");

      const existingEventIds = new Set(
        existingEventGroups
          .map((group: any) => group.eventId)
          .filter((eventId: any): eventId is string => typeof eventId === "string" && eventId.length > 0)
      );

      const missingEventIds = scope.eventIds.filter((eventId) => !existingEventIds.has(eventId));

      if (missingEventIds.length > 0) {
        const events = await Event.find({ id: { $in: missingEventIds } }).select("id title clubId");

        await Promise.all(
          events.map(async (event: any) => {
            const alreadyExists = await ChatGroup.findOne({ type: "event", eventId: event.id }).select("id");
            if (alreadyExists) return;

            await ChatGroup.create({
              id: randomUUID(),
              name: `${event.title} Event Chat`,
              type: "event",
              clubId: event.clubId,
              eventId: event.id,
              createdByType: "admin",
              createdById: "system:auto",
            });
          })
        );
      }
    }

    let groups: any[] = [];
    if (actor.role === "university_admin") {
      groups = await ChatGroup.find({}).sort({ updatedAt: -1 });
    } else {
      const filters: any[] = [];
      if (scope.clubIds.length > 0) {
        filters.push({ type: "club", clubId: { $in: scope.clubIds } });
      }
      if (scope.eventIds.length > 0) {
        filters.push({ type: "event", eventId: { $in: scope.eventIds } });
      }

      if (filters.length === 0) {
        groups = [];
      } else {
        groups = await ChatGroup.find({ $or: filters }).sort({ updatedAt: -1 });
      }
    }

    return { groups, scope };
  }

  async function canAccessChatGroup(actor: ChatActor, group: any) {
    if (actor.role === "university_admin") return true;

    const scope = await getAccessibleChatScope(actor);
    if (group.type === "club") {
      return !!group.clubId && scope.clubIds.includes(group.clubId);
    }
    if (group.type === "event") {
      return !!group.eventId && scope.eventIds.includes(group.eventId);
    }
    return false;
  }

  function canModerateChatGroup(actor: ChatActor, group: any) {
    if (actor.role === "university_admin") return true;
    if (actor.role === "club_admin") return !!actor.clubId && !!group.clubId && actor.clubId === group.clubId;
    return false;
  }

  app.get("/api/chat/me", async (req: Request, res: Response) => {
    const actor = await resolveChatActor(req);
    if (!actor) {
      return res.json({ loggedIn: false, role: "guest" });
    }

    res.json({
      loggedIn: true,
      role: actor.role,
      userType: actor.userType,
      displayName: actor.displayName,
      userId: actor.userId,
      canCreateGroup: actor.role !== "student",
      clubId: actor.clubId,
      enrollmentNumber: actor.enrollmentNumber,
    });
  });

  app.get("/api/chat/groups", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groups } = await getScopedChatGroups(actor);

      const groupSummaries = await Promise.all(
        groups.map(async (group: any) => {
          const [lastMessage, readState, membersCount] = await Promise.all([
            ChatMessage.findOne({ chatGroupId: group.id, deleted: { $ne: true } }).sort({ createdAt: -1 }),
            ChatReadState.findOne({ chatGroupId: group.id, userKey: actor.userKey }),
            group.type === "club"
              ? ClubMembership.countDocuments({ clubId: group.clubId, status: "approved" })
              : EventRegistration.countDocuments({ eventId: group.eventId, status: "approved" }),
          ]);

          const unreadQuery: any = {
            chatGroupId: group.id,
            deleted: { $ne: true },
            $or: [
              { senderType: { $ne: actor.userType } },
              { senderId: { $ne: actor.userId } },
            ],
          };

          if (readState?.lastReadAt) {
            unreadQuery.createdAt = { $gt: readState.lastReadAt };
          }

          const unreadCount = await ChatMessage.countDocuments(unreadQuery);
          const isNew = unreadCount > 0;

          const lastMessagePreview =
            lastMessage?.content ||
            (lastMessage?.type === "image"
              ? "Photo"
              : lastMessage?.type === "document"
                ? "Document"
                : "No messages yet");

          return {
            id: group.id,
            name: group.name,
            type: group.type,
            clubId: group.clubId,
            eventId: group.eventId,
            adminOnlyMessaging: !!group.adminOnlyMessaging,
            blockedMembersCount: Array.isArray(group.blockedUserKeys) ? group.blockedUserKeys.length : 0,
            icon: group.type === "club" ? "🏛️" : "🎫",
            membersCount,
            unreadCount,
            isNew,
            lastMessagePreview,
            lastMessageAt: lastMessage?.createdAt || group.updatedAt || group.createdAt,
          };
        })
      );

      const sorted = groupSummaries.sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      const totalUnread = sorted.reduce((sum, group) => sum + group.unreadCount, 0);

      res.json({
        role: actor.role,
        canCreateGroup: actor.role !== "student",
        totalUnread,
        sections: {
          clubs: sorted.filter((group) => group.type === "club"),
          events: sorted.filter((group) => group.type === "event"),
        },
      });
    } catch (error) {
      console.error("Failed to fetch chat groups:", error);
      res.status(500).json({ error: "Failed to fetch chat groups" });
    }
  });

  app.get("/api/chat/unread-count", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groups } = await getScopedChatGroups(actor);
      const readStates = await ChatReadState.find({ userKey: actor.userKey });
      const readMap = new Map(readStates.map((state: any) => [state.chatGroupId, state.lastReadAt]));

      let totalUnread = 0;
      for (const group of groups) {
        const unreadQuery: any = {
          chatGroupId: group.id,
          deleted: { $ne: true },
          $or: [
            { senderType: { $ne: actor.userType } },
            { senderId: { $ne: actor.userId } },
          ],
        };

        const lastReadAt = readMap.get(group.id);
        if (lastReadAt) {
          unreadQuery.createdAt = { $gt: lastReadAt };
        }

        totalUnread += await ChatMessage.countDocuments(unreadQuery);
      }

      res.json({ totalUnread });
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.post("/api/chat/groups", requireAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });
      if (actor.role === "student") {
        return res.status(403).json({ error: "Students cannot create chat groups" });
      }

      const { name, type, clubId, eventId } = req.body as {
        name?: string;
        type?: "club" | "event";
        clubId?: string;
        eventId?: string;
      };

      if (type !== "club" && type !== "event") {
        return res.status(400).json({ error: "Invalid group type" });
      }

      if (type === "club") {
        const targetClubId = clubId || actor.clubId;
        if (!targetClubId) return res.status(400).json({ error: "clubId is required" });
        if (actor.role === "club_admin" && targetClubId !== actor.clubId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const club = await Club.findOne({ id: targetClubId });
        if (!club) return res.status(404).json({ error: "Club not found" });

        const existing = await ChatGroup.findOne({ type: "club", clubId: targetClubId });
        if (existing) return res.json(existing);

        const group = await ChatGroup.create({
          id: randomUUID(),
          name: (name || `${club.name} Club Chat`).trim(),
          type: "club",
          clubId: targetClubId,
          createdByType: actor.userType,
          createdById: actor.userId,
        });

        return res.status(201).json(group);
      }

      if (!eventId) return res.status(400).json({ error: "eventId is required" });

      const event = await Event.findOne({ id: eventId });
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (actor.role === "club_admin" && event.clubId !== actor.clubId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const group = await ChatGroup.create({
        id: randomUUID(),
        name: (name || `${event.title} Event Chat`).trim(),
        type: "event",
        clubId: event.clubId,
        eventId: event.id,
        createdByType: actor.userType,
        createdById: actor.userId,
      });

      return res.status(201).json(group);
    } catch (error) {
      console.error("Failed to create chat group:", error);
      res.status(500).json({ error: "Failed to create chat group" });
    }
  });

  app.get("/api/chat/groups/:groupId/messages", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      if (group.isFrozen) {
        return res.status(403).json({ error: "This chat group is frozen and no messages can be sent" });
      }

      const canAccess = await canAccessChatGroup(actor, group);
      if (!canAccess) return res.status(403).json({ error: "Access denied" });

      const requestedLimit = Number(req.query.limit || 40);
      const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 40;
      const before = String(req.query.before || "").trim();

      const query: any = { chatGroupId: groupId };
      if (before) {
        const beforeDate = new Date(before);
        if (!Number.isNaN(beforeDate.getTime())) {
          query.createdAt = { $lt: beforeDate };
        }
      }

      const latestFirst = await ChatMessage.find(query).sort({ createdAt: -1 }).limit(limit + 1);
      const hasMore = latestFirst.length > limit;
      const sliced = hasMore ? latestFirst.slice(0, limit) : latestFirst;
      const messages = sliced.reverse();
      const nextCursor = hasMore && messages.length > 0 ? messages[0].createdAt : null;

      res.json({
        messages,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/groups/:groupId/messages", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      if (group.isFrozen) {
        return res.status(403).json({ error: "This chat group is frozen and no messages can be sent" });
      }

      const canAccess = await canAccessChatGroup(actor, group);
      if (!canAccess) return res.status(403).json({ error: "Access denied" });

      if (actor.role === "student") {
        if (group.adminOnlyMessaging) {
          return res.status(403).json({ error: "Only admins can send messages in this chat" });
        }

        if (Array.isArray(group.blockedUserKeys) && group.blockedUserKeys.includes(actor.userKey)) {
          return res.status(403).json({ error: "You are restricted from sending messages in this chat" });
        }
      }

      const {
        content,
        type,
        attachmentUrl,
        attachmentName,
        replyToMessageId,
        clientRequestId,
      } = req.body as {
        content?: string;
        type?: "text" | "image" | "document";
        attachmentUrl?: string;
        attachmentName?: string;
        replyToMessageId?: string;
        clientRequestId?: string;
      };

      let replyToSenderName: string | undefined;
      let replyToContentPreview: string | undefined;
      if (replyToMessageId) {
        const parentMessage = await ChatMessage.findOne({ id: replyToMessageId, chatGroupId: group.id });
        if (!parentMessage) {
          return res.status(400).json({ error: "Reply target message not found" });
        }

        replyToSenderName = parentMessage.senderName;
        replyToContentPreview = parentMessage.deleted
          ? "Deleted message"
          : (parentMessage.content ||
              (parentMessage.type === "image"
                ? "Photo"
                : parentMessage.type === "document"
                  ? "Document"
                  : "Message"));
      }

      const safeContent = (content || "").trim();
      if (!safeContent && !attachmentUrl) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const messageType = type || (attachmentUrl ? "document" : "text");
      if (!["text", "image", "document"].includes(messageType)) {
        return res.status(400).json({ error: "Invalid message type" });
      }

      const message = await ChatMessage.create({
        id: randomUUID(),
        chatGroupId: group.id,
        senderType: actor.userType,
        senderId: actor.userId,
        senderName: actor.displayName,
        content: safeContent,
        type: messageType,
        attachmentUrl,
        attachmentName,
        replyToMessageId,
        replyToSenderName,
        replyToContentPreview,
        clientRequestId: clientRequestId || undefined,
        deleted: false,
        createdAt: new Date(),
      });

      await ChatGroup.updateOne({ id: group.id }, { $set: { updatedAt: new Date() } });

      res.status(201).json(message);
    } catch (error) {
      console.error("Failed to send chat message:", error);
      res.status(500).json({ error: "Failed to send chat message" });
    }
  });

  app.post("/api/chat/groups/:groupId/read", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      const canAccess = await canAccessChatGroup(actor, group);
      if (!canAccess) return res.status(403).json({ error: "Access denied" });

      await ChatReadState.findOneAndUpdate(
        { chatGroupId: groupId, userKey: actor.userKey },
        { $set: { lastReadAt: new Date() } },
        { upsert: true, new: true }
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update chat read state:", error);
      res.status(500).json({ error: "Failed to update read state" });
    }
  });

  app.patch("/api/chat/groups/:groupId/messages/:messageId/pin", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId, messageId } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      const canAccess = await canAccessChatGroup(actor, group);
      if (!canAccess) return res.status(403).json({ error: "Access denied" });

      const message = await ChatMessage.findOne({ id: messageId, chatGroupId: group.id });
      if (!message) return res.status(404).json({ error: "Message not found" });

      const isOwnMessage = message.senderType === actor.userType && message.senderId === actor.userId;
      if (!isOwnMessage && !canModerateChatGroup(actor, group)) {
        return res.status(403).json({ error: "Not allowed to pin this message" });
      }

      const { pinned } = req.body as { pinned?: boolean };
      const nextPinned = typeof pinned === "boolean" ? pinned : !message.isPinned;

      message.isPinned = nextPinned;
      message.pinnedAt = nextPinned ? new Date() : undefined;
      message.pinnedByUserKey = nextPinned ? actor.userKey : undefined;
      await message.save();

      await createSystemAuditMessage({
        groupId: group.id,
        actor,
        action: nextPinned ? "message_pinned" : "message_unpinned",
        content: `${actor.displayName} ${nextPinned ? "pinned" : "unpinned"} a message.`,
      });

      return res.json({ success: true, pinned: message.isPinned });
    } catch (error) {
      console.error("Failed to pin message:", error);
      res.status(500).json({ error: "Failed to pin message" });
    }
  });

  app.delete("/api/chat/groups/:groupId/messages/:messageId", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId, messageId } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      const canAccess = await canAccessChatGroup(actor, group);
      if (!canAccess) return res.status(403).json({ error: "Access denied" });

      const message = await ChatMessage.findOne({ id: messageId, chatGroupId: group.id });
      if (!message) return res.status(404).json({ error: "Message not found" });

      const isOwnMessage = message.senderType === actor.userType && message.senderId === actor.userId;
      if (!isOwnMessage && !canModerateChatGroup(actor, group)) {
        return res.status(403).json({ error: "You can delete only your own message" });
      }

      message.deleted = true;
      message.deletedAt = new Date();
      message.deletedByUserKey = actor.userKey;
      message.content = "";
      message.attachmentUrl = undefined;
      message.attachmentName = undefined;
      message.type = "text";
      await message.save();

      await createSystemAuditMessage({
        groupId: group.id,
        actor,
        action: "message_deleted",
        content: `${actor.displayName} deleted a message.`,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  app.get("/api/chat/groups/:groupId/pinned", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      const canAccess = await canAccessChatGroup(actor, group);
      if (!canAccess) return res.status(403).json({ error: "Access denied" });

      const pinnedMessages = await ChatMessage.find({
        chatGroupId: group.id,
        isPinned: true,
        deleted: { $ne: true },
      })
        .sort({ pinnedAt: -1, createdAt: -1 })
        .limit(50);

      return res.json({ messages: pinnedMessages });
    } catch (error) {
      console.error("Failed to fetch pinned messages:", error);
      res.status(500).json({ error: "Failed to fetch pinned messages" });
    }
  });

  app.get("/api/chat/groups/:groupId/members", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      const canAccess = await canAccessChatGroup(actor, group);
      if (!canAccess) return res.status(403).json({ error: "Access denied" });

      const blockedSet = new Set(Array.isArray(group.blockedUserKeys) ? group.blockedUserKeys : []);

      if (group.type === "club") {
        const memberships = await ClubMembership.find({ clubId: group.clubId, status: "approved" });
        const members = memberships.map((membership: any) => {
          const userKey = `student:${membership.enrollmentNumber}`;
          return {
            enrollmentNumber: membership.enrollmentNumber,
            name: membership.studentName,
            email: membership.studentEmail,
            userKey,
            blocked: blockedSet.has(userKey),
          };
        });

        return res.json({
          groupId: group.id,
          groupType: group.type,
          adminOnlyMessaging: !!group.adminOnlyMessaging,
          canModerate: canModerateChatGroup(actor, group),
          members,
        });
      }

      const registrations = await EventRegistration.find({ eventId: group.eventId, status: "approved" });
      const members = registrations.map((registration: any) => {
        const userKey = `student:${registration.enrollmentNumber}`;
        return {
          enrollmentNumber: registration.enrollmentNumber,
          name: registration.studentName,
          email: registration.studentEmail,
          userKey,
          blocked: blockedSet.has(userKey),
        };
      });

      return res.json({
        groupId: group.id,
        groupType: group.type,
        adminOnlyMessaging: !!group.adminOnlyMessaging,
        canModerate: canModerateChatGroup(actor, group),
        members,
      });
    } catch (error) {
      console.error("Failed to fetch chat members:", error);
      res.status(500).json({ error: "Failed to fetch chat members" });
    }
  });

  app.delete("/api/chat/groups/:groupId", requireAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      // Only admins can delete event chats
      if (group.type === "event") {
        if (actor.userType !== "admin") {
          return res.status(403).json({ error: "Only admins can delete event chats" });
        }
      } else {
        // For club chats, only the club admin or university admin can delete
        if (!canModerateChatGroup(actor, group)) {
          return res.status(403).json({ error: "You do not have permission to delete this chat group" });
        }
      }

      // Delete all messages in the chat group
      await ChatMessage.deleteMany({ chatGroupId: groupId });

      // Delete the chat group
      await ChatGroup.deleteOne({ id: groupId });

      res.json({ success: true, message: "Chat group deleted successfully" });
    } catch (error) {
      console.error("Failed to delete chat group:", error);
      res.status(500).json({ error: "Failed to delete chat group" });
    }
  });

  app.patch("/api/chat/groups/:groupId/settings", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      if (!canModerateChatGroup(actor, group)) {
        return res.status(403).json({ error: "Only admins of this club can change chat settings" });
      }

      const { adminOnlyMessaging } = req.body as { adminOnlyMessaging?: boolean };
      if (typeof adminOnlyMessaging !== "boolean") {
        return res.status(400).json({ error: "adminOnlyMessaging must be a boolean" });
      }

      const previousValue = !!group.adminOnlyMessaging;
      group.adminOnlyMessaging = adminOnlyMessaging;

      await group.save();

      if (previousValue !== group.adminOnlyMessaging) {
        await createSystemAuditMessage({
          groupId: group.id,
          actor,
          action: "settings_update",
          content: `${actor.displayName} ${group.adminOnlyMessaging ? "enabled" : "disabled"} admin-only messaging.`,
        });
      }

      res.json({
        success: true,
        adminOnlyMessaging: !!group.adminOnlyMessaging,
      });
    } catch (error) {
      console.error("Failed to update chat settings:", error);
      res.status(500).json({ error: "Failed to update chat settings" });
    }
  });

  app.patch("/api/chat/groups/:groupId/members/:enrollmentNumber", requireAnyAuth, async (req: Request, res: Response) => {
    try {
      const actor = await resolveChatActor(req);
      if (!actor) return res.status(401).json({ error: "Unauthorized" });

      const { groupId, enrollmentNumber } = req.params;
      const group = await ChatGroup.findOne({ id: groupId });
      if (!group) return res.status(404).json({ error: "Chat group not found" });

      if (!canModerateChatGroup(actor, group)) {
        return res.status(403).json({ error: "Only admins of this club can moderate members" });
      }

      const { action } = req.body as { action?: "block" | "unblock" | "remove" };
      if (!action || !["block", "unblock", "remove"].includes(action)) {
        return res.status(400).json({ error: "Invalid moderation action" });
      }

      const userKey = `student:${enrollmentNumber}`;
      const blockedSet = new Set(Array.isArray(group.blockedUserKeys) ? group.blockedUserKeys : []);

      if (action === "block") {
        blockedSet.add(userKey);
      }

      if (action === "unblock") {
        blockedSet.delete(userKey);
      }

      if (action === "remove") {
        blockedSet.add(userKey);

        if (group.type === "club") {
          await ClubMembership.findOneAndUpdate(
            { clubId: group.clubId, enrollmentNumber },
            { status: "rejected" },
            { new: true }
          );
        } else {
          await EventRegistration.findOneAndUpdate(
            { eventId: group.eventId, enrollmentNumber },
            { status: "rejected" },
            { new: true }
          );
        }
      }

      group.blockedUserKeys = Array.from(blockedSet);
      await group.save();

      await createSystemAuditMessage({
        groupId: group.id,
        actor,
        action: `member_${action}`,
        content:
          action === "remove"
            ? `${actor.displayName} removed ${enrollmentNumber} from this chat.`
            : action === "block"
              ? `${actor.displayName} blocked ${enrollmentNumber} from sending messages.`
              : `${actor.displayName} unblocked ${enrollmentNumber}.`,
      });

      res.json({ success: true, action, enrollmentNumber, blocked: blockedSet.has(userKey) });
    } catch (error) {
      console.error("Failed to moderate chat member:", error);
      res.status(500).json({ error: "Failed to moderate member" });
    }
  });

  // Test route
  app.get("/api/test-join", (req: Request, res: Response) => {
    res.json({ message: "Test route works" });
  });

  // Club Membership Routes
  console.log("Registering club join route: /api/clubs/:clubId/join");
  app.post("/api/clubs/:clubId/join", requireStudentAuth, async (req: Request, res: Response) => {
    console.log("Join route hit:", req.path, req.params, req.body, req.method, req.headers['content-type']);
    console.log("ClubId from params:", req.params.clubId);

    try {
      const clubId = req.params.clubId;
      const { reason } = req.body;

      // Validate input
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: "Reason is required" });
      }

      // Get club details
      const club = await storage.getClub(clubId);
      if (!club) {
        console.log("Club not found:", clubId);
        return res.status(404).json({ error: "Club not found" });
      }

      // Get student details
      const student = await Student.findById(req.session.studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Check if student is already a member or has a pending request
      const existingMembership = await ClubMembership.findOne({
        enrollmentNumber: student.enrollment,
        clubId: clubId
      });

      if (existingMembership) {
        if (existingMembership.status === 'approved') {
          return res.status(400).json({ error: "You are already a member of this club" });
        } else if (existingMembership.status === 'pending') {
          return res.status(400).json({ error: "You already have a pending membership request for this club" });
        }
      }

      // Create membership request
      const membership = await storage.createClubMembership({
        studentName: student.name,
        studentEmail: student.email,
        enrollmentNumber: student.enrollment,
        department: student.department,
        reason: reason.trim(),
        clubId,
        clubName: club.name,
        status: 'pending'
      });

      console.log("Membership created:", membership);
      res.json({ success: true, membership });
    } catch (error) {
      console.error("Membership error:", error);
      res.status(500).json({ error: "Failed to join club" });
    }
  });

  app.get("/api/student/club-memberships", requireStudentAuth, async (req: Request, res: Response) => {
    try {
      const student = await Student.findById(req.session.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const memberships = await storage.getClubMembershipsByStudent(student.enrollment);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memberships" });
    }
  });

  // Achievement Routes
  app.post("/api/admin/achievements", requireClubOwnership, upload.single("image"), async (req: Request, res: Response) => {
    try {
      const admin = (req as any).admin;
      if (!admin) return res.status(401).json({ error: "Admin not found" });

      const club = await storage.getClub(admin.clubId!);
      if (!club) return res.status(400).json({ error: "Club not found" });

      const achievementData = {
        ...req.body,
        clubId: admin.clubId,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null
      };

      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Achievement creation error:", error);
      res.status(400).json({ error: "Invalid achievement data" });
    }
  });

  app.get("/api/admin/achievements/:clubId", requireClubOwnership, async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const achievements = await storage.getAchievementsByClub(clubId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.delete("/api/admin/achievements/:achievementId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { achievementId } = req.params;

      const achievement = await Achievement.findOne({ id: achievementId });
      if (!achievement) return res.status(404).json({ error: "Achievement not found" });

      // Check if admin owns this club
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin || achievement.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const success = await storage.deleteAchievement(achievementId);
      if (!success) return res.status(404).json({ error: "Achievement not found" });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete achievement" });
    }
  });

  // Club Leadership Routes
  app.post("/api/admin/club-leadership", requireClubOwnership, async (req: Request, res: Response) => {
    try {
      const admin = (req as any).admin;
      if (!admin) return res.status(401).json({ error: "Admin not found" });

      const leadershipData = {
        ...req.body,
        clubId: admin.clubId,
      };

      const leadership = await storage.createClubLeadership(leadershipData);
      res.status(201).json(leadership);
    } catch (error) {
      console.error("Leadership creation error:", error);
      res.status(400).json({ error: "Invalid leadership data" });
    }
  });

  app.get("/api/club-leadership/:clubId", async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const leadership = await storage.getClubLeadershipByClub(clubId);
      res.json(leadership);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leadership" });
    }
  });

  app.delete("/api/admin/club-leadership/:leadershipId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { leadershipId } = req.params;

      const leadership = await ClubLeadership.findOne({ id: leadershipId });
      if (!leadership) return res.status(404).json({ error: "Leadership not found" });

      // Check if admin owns this club
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin || leadership.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const success = await storage.deleteClubLeadership(leadershipId);
      if (!success) return res.status(404).json({ error: "Leadership not found" });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete leadership" });
    }
  });

  // Student Points and Badges Management
  app.get("/api/admin/student-points/:clubId", requireClubOwnership, async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const admin = (req as any).admin;
      if (!admin || admin.clubId !== clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { page, limit, skip, requested } = parsePagination(req.query, {
        page: 1,
        limit: 50,
        maxLimit: 200,
      });

      const search = String(req.query.search || "").trim();
      const query: any = { clubId };
      if (search) {
        const escaped = escapeRegexInput(search.slice(0, 80));
        query.$or = [
          { studentName: { $regex: escaped, $options: "i" } },
          { studentEmail: { $regex: escaped, $options: "i" } },
          { enrollmentNumber: { $regex: escaped, $options: "i" } },
        ];
      }

      const total = await StudentPoints.countDocuments(query);
      const studentPoints = await StudentPoints.find(query)
        .sort({ points: -1, lastUpdated: -1 })
        .skip(skip)
        .limit(limit);

      if (requested) {
        return res.json({
          items: studentPoints,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        });
      }

      res.json(studentPoints);
    } catch (error) {
      console.error("Failed to fetch student points:", error);
      res.status(500).json({ error: "Failed to fetch student points" });
    }
  });

  app.post("/api/admin/student-points", requireClubOwnership, async (req: Request, res: Response) => {
    try {
      const { clubId, studentId, studentName, studentEmail, enrollmentNumber, points, badges, skills, reason } = req.body;

      const admin = (req as any).admin;
      if (!admin || admin.clubId !== clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const studentPoints = await StudentPoints.findOneAndUpdate(
        { clubId, studentId },
        {
          $inc: { points: points || 0 },
          $addToSet: {
            badges: { $each: badges || [] },
            skills: { $each: skills || [] }
          },
          $set: {
            studentName,
            studentEmail,
            enrollmentNumber,
            lastAwardReason: reason || "",
            lastUpdated: new Date()
          }
        },
        { upsert: true, new: true }
      );

      res.status(201).json(studentPoints);
    } catch (error) {
      console.error("Failed to create/update student points:", error);
      res.status(500).json({ error: "Failed to create/update student points" });
    }
  });

  app.patch("/api/admin/student-points/:studentPointsId", requireClubOwnership, async (req: Request, res: Response) => {
    try {
      const { studentPointsId } = req.params;
      const { points, badges } = req.body;

      const studentPoints = await StudentPoints.findOne({ id: studentPointsId });
      if (!studentPoints) return res.status(404).json({ error: "Student points not found" });

      const admin = (req as any).admin;
      if (!admin || studentPoints.clubId.toString() !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      studentPoints.points = points !== undefined ? points : studentPoints.points;
      studentPoints.badges = badges !== undefined ? badges : studentPoints.badges;
      studentPoints.lastUpdated = new Date();

      await studentPoints.save();
      res.json(studentPoints);
    } catch (error) {
      console.error("Failed to update student points:", error);
      res.status(500).json({ error: "Failed to update student points" });
    }
  });

  app.post("/api/admin/student-points/award-attendance", requireAuth, async (req: Request, res: Response) => {
    try {
      const { clubId, studentId, studentName, studentEmail, enrollmentNumber, eventId } = req.body;

      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin || admin.clubId !== clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Award points for attendance (10 points per event)
      const attendancePoints = 10;

      const studentPoints = await StudentPoints.findOneAndUpdate(
        { clubId, studentId },
        {
          $inc: { points: attendancePoints },
          $set: {
            studentName,
            studentEmail,
            enrollmentNumber,
            lastUpdated: new Date()
          }
        },
        { upsert: true, new: true }
      );

      // Check for badges based on points
      const badges = [];
      if (studentPoints.points >= 50) badges.push("Regular Attendee");
      if (studentPoints.points >= 100) badges.push("Active Member");
      if (studentPoints.points >= 200) badges.push("Club Champion");

      if (badges.length > 0) {
        studentPoints.badges = [...new Set([...(studentPoints.badges || []), ...badges])];
        await studentPoints.save();
      }

      res.json({
        studentPoints,
        pointsAwarded: attendancePoints,
        newBadges: badges.length > 0 ? badges : null
      });
    } catch (error) {
      console.error("Failed to award attendance points:", error);
      res.status(500).json({ error: "Failed to award attendance points" });
    }
  });

  // Club Admin Routes for Membership Management
  app.get("/api/admin/club-memberships/:clubId", requireClubOwnership, async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const memberships = await storage.getClubMembershipsByClub(clubId);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memberships" });
    }
  });

  app.patch("/api/admin/club-memberships/:membershipId", requireClubOwnership, async (req: Request, res: Response) => {
    try {
      const { membershipId } = req.params;
      const { status } = req.body;
      const admin = (req as any).admin;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const membership = await storage.updateClubMembershipStatus(membershipId, status);
      if (!membership) return res.status(404).json({ error: "Membership not found" });

      // Verify admin owns this club
      if (admin.clubId !== membership.clubId) {
        return res.status(403).json({ error: "Not authorized to modify this membership" });
      }

      // Update club member count if membership is approved
      if (status === 'approved') {
        await storage.incrementClubMemberCount(membership.clubId);
      }

      res.json(membership);
    } catch (error) {
      res.status(500).json({ error: "Failed to update membership status" });
    }
  });

  app.delete("/api/admin/club-memberships/:membershipId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { membershipId } = req.params;

      const membership = await ClubMembership.findOne({ id: membershipId });
      if (!membership) return res.status(404).json({ error: "Membership not found" });

      // Check if admin owns this club
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin || membership.clubId !== admin.clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // If membership was approved, decrement club member count
      if (membership.status === 'approved') {
        await Club.findOneAndUpdate({ id: membership.clubId }, { $inc: { memberCount: -1 } });
      }

      const success = await storage.deleteClubMembership(membershipId);
      if (!success) return res.status(404).json({ error: "Membership not found" });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete membership" });
    }
  });

  app.get("/api/admin/event-registrations/:clubId", requireClubOwnership, async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const admin = (req as any).admin;
      if (!admin || admin.clubId !== clubId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { page, limit, skip, requested } = parsePagination(req.query, {
        page: 1,
        limit: 100,
        maxLimit: 500,
      });

      const status = String(req.query.status || "").trim();
      const attendanceStatus = String(req.query.attendanceStatus || "").trim();
      const eventId = String(req.query.eventId || "").trim();
      const search = String(req.query.search || "").trim();

      // Get all events for this club
      const allEvents = await storage.getAllEvents();
      const clubEvents = allEvents.filter(e => e.clubId === clubId);
      const clubEventIds = clubEvents.map(e => e.id);

      if (clubEventIds.length === 0) {
        if (requested) {
          return res.json({
            items: [],
            pagination: { total: 0, page, limit, totalPages: 0 },
          });
        }
        return res.json([]);
      }

      const scopedEventIds = eventId ? clubEventIds.filter((id) => id === eventId) : clubEventIds;
      if (eventId && scopedEventIds.length === 0) {
        return res.status(403).json({ error: "Event does not belong to this club" });
      }

      const query: any = {
        eventId: { $in: scopedEventIds },
      };

      if (["pending", "approved", "rejected"].includes(status)) {
        query.status = status;
      }

      if (["pending", "present", "absent"].includes(attendanceStatus)) {
        query.attendanceStatus = attendanceStatus;
      }

      if (search) {
        const escaped = escapeRegexInput(search.slice(0, 80));
        query.$or = [
          { studentName: { $regex: escaped, $options: "i" } },
          { studentEmail: { $regex: escaped, $options: "i" } },
          { enrollmentNumber: { $regex: escaped, $options: "i" } },
          { rollNumber: { $regex: escaped, $options: "i" } },
        ];
      }

      const total = await EventRegistration.countDocuments(query);

      // Get all registrations for these events
      const registrations = await EventRegistration.find(query)
        .sort({ registeredAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit);

      if (requested) {
        return res.json({
          items: registrations,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        });
      }

      res.json(registrations);
    } catch (error) {
      console.error("Failed to fetch event registrations:", error);
      res.status(500).json({ error: "Failed to fetch event registrations" });
    }
  });

  app.patch("/api/admin/event-registrations/:registrationId/attendance", requireAuth, async (req: Request, res: Response) => {
    try {
      const { registrationId } = req.params;
      const { attended, attendanceStatus } = req.body;
      const adminId = req.session.adminId;

      // Determine status: if attendanceStatus is provided use it, otherwise derive from attended boolean
      const status = attendanceStatus || (attended ? 'present' : 'absent');

      const registration = await EventRegistration.findOneAndUpdate(
        { id: registrationId },
        { 
          attended: attended || status === 'present',
          attendanceStatus: status,
          attendanceMarkedAt: new Date(),
          attendanceMarkedBy: adminId
        },
        { new: true }
      );

      if (!registration) return res.status(404).json({ error: "Registration not found" });

      res.json(registration);
    } catch (error) {
      console.error("Failed to update attendance:", error);
      res.status(500).json({ error: "Failed to update attendance" });
    }
  });

  app.post("/api/admin/event-registrations/batch-attendance", requireAuth, async (req: Request, res: Response) => {
    try {
      const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
      if (updates.length === 0) {
        return res.status(400).json({ error: "updates array is required" });
      }

      if (updates.length > 500) {
        return res.status(400).json({ error: "Batch limit exceeded (max 500 updates)" });
      }

      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin) {
        return res.status(401).json({ error: "Admin not found" });
      }

      const registrationIds = updates
        .map((item: any) => String(item?.registrationId || "").trim())
        .filter(Boolean);

      if (registrationIds.length === 0) {
        return res.status(400).json({ error: "No valid registrationIds provided" });
      }

      const updateMap = new Map<string, { attended: boolean }>();
      for (const item of updates) {
        const registrationId = String(item?.registrationId || "").trim();
        if (!registrationId) continue;
        updateMap.set(registrationId, { attended: !!item?.attended });
      }

      const registrations = await EventRegistration.find({ id: { $in: Array.from(updateMap.keys()) } });
      if (registrations.length === 0) {
        return res.status(404).json({ error: "No matching registrations found" });
      }

      const eventIds = [...new Set(registrations.map((registration: any) => registration.eventId))];
      const events = await Event.find({ id: { $in: eventIds } }).select("id clubId");
      const eventClubMap = new Map(events.map((event: any) => [event.id, event.clubId]));

      // University admins can update any club; club admins are scoped to their own club.
      if (admin.clubId) {
        const unauthorized = registrations.find((registration: any) => {
          const clubId = eventClubMap.get(registration.eventId);
          return clubId !== admin.clubId;
        });

        if (unauthorized) {
          return res.status(403).json({ error: "Not authorized to update one or more registrations" });
        }
      }

      const now = new Date();
      const bulkOps: any[] = [];
      const pointAwards: Array<{
        clubId: string;
        studentId: string;
        studentName: string;
        studentEmail: string;
        enrollmentNumber: string;
      }> = [];

      for (const registration of registrations as any[]) {
        const target = updateMap.get(registration.id);
        if (!target) continue;

        const attended = !!target.attended;
        const attendanceStatus = attended ? "present" : "absent";
        const eventClubId = eventClubMap.get(registration.eventId);

        if (!eventClubId) continue;

        if (registration.attended !== attended || registration.attendanceStatus !== attendanceStatus) {
          bulkOps.push({
            updateOne: {
              filter: { id: registration.id },
              update: {
                $set: {
                  attended,
                  attendanceStatus,
                  attendanceMarkedAt: now,
                  attendanceMarkedBy: req.session.adminId,
                },
              },
            },
          });
        }

        // Award points only when transitioning into present for the first time in this change set.
        if (attended && !registration.attended) {
          pointAwards.push({
            clubId: eventClubId,
            studentId: registration.studentEmail,
            studentName: registration.studentName,
            studentEmail: registration.studentEmail,
            enrollmentNumber: registration.enrollmentNumber,
          });
        }
      }

      if (bulkOps.length > 0) {
        await EventRegistration.bulkWrite(bulkOps, { ordered: false });
      }

      let pointsAwardedCount = 0;
      for (const award of pointAwards) {
        const studentPoints = await StudentPoints.findOneAndUpdate(
          { clubId: award.clubId, studentId: award.studentId },
          {
            $inc: { points: 10 },
            $set: {
              studentName: award.studentName,
              studentEmail: award.studentEmail,
              enrollmentNumber: award.enrollmentNumber,
              lastUpdated: now,
            },
          },
          { upsert: true, new: true },
        );

        const badges: string[] = [];
        if (studentPoints.points >= 50) badges.push("Regular Attendee");
        if (studentPoints.points >= 100) badges.push("Active Member");
        if (studentPoints.points >= 200) badges.push("Club Champion");

        if (badges.length > 0) {
          studentPoints.badges = [...new Set([...(studentPoints.badges || []), ...badges])];
          await studentPoints.save();
        }

        pointsAwardedCount += 1;
      }

      res.json({
        success: true,
        requestedCount: updates.length,
        updatedCount: bulkOps.length,
        pointsAwardedCount,
      });
    } catch (error) {
      console.error("Failed to batch update attendance:", error);
      res.status(500).json({ error: "Failed to batch update attendance" });
    }
  });

  app.patch("/api/admin/event-registrations/:registrationId/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const { registrationId } = req.params;
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin) return res.status(401).json({ error: "Admin not found" });

      const registration = await EventRegistration.findOne({ id: registrationId });
      if (!registration) return res.status(404).json({ error: "Registration not found" });

      if (admin.clubId) {
        const event = await storage.getEvent(registration.eventId);
        if (!event || event.clubId !== admin.clubId) {
          return res.status(403).json({ error: "Not authorized" });
        }
      }

      registration.status = status;
      await registration.save();

      res.json(registration);
    } catch (error) {
      console.error("Failed to update registration status:", error);
      res.status(500).json({ error: "Failed to update registration status" });
    }
  });

  // Club Admin: get announcements
  app.get("/api/admin/announcements", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = await Admin.findOne({ id: req.session.adminId });
      if (!admin) return res.status(404).json({ error: "Admin not found" });

      const announcements = await storage.getAnnouncements(50); // Get more announcements for admins
      res.json(announcements);
    } catch (error) {
      console.error("Failed to fetch admin announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  // Club Admin: mark announcement as read
  app.put("/api/announcements/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = await Admin.findOne({ id: req.session.adminId });
      if (!admin) return res.status(404).json({ error: "Admin not found" });

      const announcement = await Announcement.findOneAndUpdate(
        { id },
        { $set: { isRead: true } },
        { new: true }
      );

      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }

      res.json({ success: true, announcement });
    } catch (error) {
      console.error("Failed to mark announcement as read:", error);
      res.status(500).json({ error: "Failed to mark announcement as read" });
    }
  });

  // Analytics Endpoints
  app.get("/api/analytics/overview", requireAuth, async (req: Request, res: Response) => {
    try {
      const [clubs, events, students, memberships] = await Promise.all([
        storage.getAllClubs(),
        storage.getAllEvents(),
        Student.find({}).select('id name email enrollment department lastLogin isDisabled'),
        ClubMembership.find({ status: 'approved' }).select('joinedAt clubId')
      ]);

      // Create a map of clubId -> member count
      const memberCountMap = new Map<string, number>();
      memberships.forEach(membership => {
        const current = memberCountMap.get(membership.clubId) || 0;
        memberCountMap.set(membership.clubId, current + 1);
      });

      // Add actual member counts to clubs
      const clubsWithMemberCounts = clubs.map((club) => {
        const clubObj = club.toObject ? club.toObject() : club;
        // Use actual membership count if available, otherwise use club's existing memberCount
        const actualCount = memberCountMap.get(club.id);
        return {
          ...clubObj,
          memberCount: actualCount !== undefined ? actualCount : (clubObj.memberCount || 0)
        };
      });

      const totalStudents = students.length;
      const activeStudents = students.filter(s => !s.isDisabled).length;
      const totalClubs = clubsWithMemberCounts.length;
      const activeClubs = clubsWithMemberCounts.filter(c => (c.memberCount || 0) > 0).length;
      const totalEvents = events.length;
      const upcomingEvents = events.filter(e => new Date(e.date || new Date()) > new Date()).length;

      // Club categories distribution
      const clubCategories = clubsWithMemberCounts.reduce((acc: Record<string, number>, club) => {
        const category = club.category?.toLowerCase() || 'uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      // Event categories distribution
      const eventCategories = events.reduce((acc: Record<string, number>, event) => {
        const category = event.category?.toLowerCase() || 'uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      // Top performing clubs
      const topClubs = clubsWithMemberCounts
        .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
        .slice(0, 5)
        .map(club => ({
          id: club.id,
          name: club.name,
          category: club.category,
          memberCount: club.memberCount || 0,
          eventCount: events.filter(e => e.clubId === club.id).length
        }));

      // Membership trends over last 6 months
      const membershipTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();

        const count = memberships.filter(m => {
          const joinedDate = new Date(m.joinedAt);
          return joinedDate.getMonth() === month && joinedDate.getFullYear() === year;
        }).length;

        membershipTrends.push({
          month: date.toLocaleString('default', { month: 'short' }),
          year,
          newMembers: count
        });
      }

      // Monthly trends (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const eventsThisMonth = events.filter(e => {
        const eventDate = new Date(e.date || new Date());
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }).length;

      res.json({
        overview: {
          totalClubs,
          activeClubs,
          totalEvents,
          upcomingEvents,
          totalStudents,
          activeStudents
        },
        distributions: {
          clubCategories,
          eventCategories
        },
        topClubs,
        membershipTrends,
        trends: {
          eventsThisMonth,
          clubCoverage: totalClubs > 0 ? Math.round((activeClubs / totalClubs) * 100) : 0,
          eventDiversity: Object.keys(eventCategories).length,
          studentEngagement: totalStudents > 0 ? Math.round((totalEvents / totalStudents) * 100) / 100 : 0
        }
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  app.get("/api/analytics/events", requireAuth, async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      const registrations = await EventRegistration.find({});

      // Event status breakdown
      const upcoming = events.filter(e => new Date(e.date || new Date()) > new Date()).length;
      const past = events.filter(e => new Date(e.date || new Date()) <= new Date()).length;

      // Events by month (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();

        const count = events.filter(e => {
          const eventDate = new Date(e.date || new Date());
          return eventDate.getMonth() === month && eventDate.getFullYear() === year;
        }).length;

        monthlyData.push({
          month: date.toLocaleString('default', { month: 'short' }),
          year,
          count
        });
      }

      // Registration vs Attendance data
      const registrationVsAttendance = events.map(event => {
        const eventRegistrations = registrations.filter(r => r.eventId === event.id);
        const totalRegistrations = eventRegistrations.length;
        const totalAttended = eventRegistrations.filter(r => r.attended).length;

        return {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          registrations: totalRegistrations,
          attendance: totalAttended,
          attendanceRate: totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0
        };
      }).filter(item => item.registrations > 0); // Only show events with registrations

      res.json({
        statusBreakdown: { upcoming, past },
        monthlyTrends: monthlyData,
        registrationVsAttendance
      });
    } catch (error) {
      console.error("Failed to fetch event analytics:", error);
      res.status(500).json({ error: "Failed to fetch event analytics" });
    }
  });

  app.get("/api/analytics/students", requireAuth, async (req: Request, res: Response) => {
    try {
      const students = await Student.find({}).select('department enrollment lastLogin isDisabled');

      // Branch distribution
      const branchDistribution = students.reduce((acc: Record<string, number>, student) => {
        const branch = student.department || 'Unknown';
        acc[branch] = (acc[branch] || 0) + 1;
        return acc;
      }, {});

      // Activity metrics
      const activeStudents = students.filter(s => !s.isDisabled).length;
      const recentlyActive = students.filter(s => {
        if (!s.lastLogin) return false;
        const daysSinceLogin = (new Date().getTime() - new Date(s.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLogin <= 30;
      }).length;

      res.json({
        totalStudents: students.length,
        activeStudents,
        recentlyActive,
        branchDistribution
      });
    } catch (error) {
      console.error("Failed to fetch student analytics:", error);
      res.status(500).json({ error: "Failed to fetch student analytics" });
    }
  });

  // Student Points and Rank
  app.get("/api/student/points", requireStudentAuth, async (req: Request, res: Response) => {
    try {
      const student = await Student.findById(req.session.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const studentEmail = student.email;

      // Get all clubs for club name lookup
      const clubs = await storage.getAllClubs();

      // Get all student points across all clubs
      const studentPoints = await StudentPoints.find({ studentEmail }).sort({ points: -1 });

      // Calculate total points and rank
      const totalPoints = studentPoints.reduce((sum, sp) => sum + sp.points, 0);

      // Get all students' total points to calculate rank
      const allStudentTotals = await StudentPoints.aggregate([
        {
          $group: {
            _id: "$studentEmail",
            totalPoints: { $sum: "$points" }
          }
        },
        {
          $sort: { totalPoints: -1 }
        }
      ]);

      const studentRank = allStudentTotals.findIndex(s => s._id === studentEmail) + 1;

      // Get badges from all clubs
      const allBadges = studentPoints.flatMap(sp => sp.badges || []);

      // Get skills from all clubs
      const allSkills = studentPoints.flatMap(sp => sp.skills || []);

      // Calculate points this month and this week
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const pointsThisMonth = studentPoints.reduce((sum, sp) => {
        const lastUpdated = new Date(sp.lastUpdated);
        return lastUpdated >= startOfMonth ? sum + sp.points : sum;
      }, 0);

      const pointsThisWeek = studentPoints.reduce((sum, sp) => {
        const lastUpdated = new Date(sp.lastUpdated);
        return lastUpdated >= startOfWeek ? sum + sp.points : sum;
      }, 0);

      res.json({
        totalPoints,
        rank: studentRank,
        badges: [...new Set(allBadges)],
        skills: [...new Set(allSkills)],
        pointsThisMonth,
        pointsThisWeek,
        clubBreakdown: studentPoints.map(sp => ({
          clubId: sp.clubId,
          clubName: clubs.find(c => c.id === sp.clubId.toString())?.name || 'Unknown Club',
          points: sp.points,
          badges: sp.badges || [],
          skills: sp.skills || []
        }))
      });
    } catch (error) {
      console.error("Failed to fetch student points:", error);
      res.status(500).json({ error: "Failed to fetch student points" });
    }
  });

  // Global Points Leaderboard for Club Admins
  app.get("/api/admin/global-points-leaderboard", requireAuth, async (req: Request, res: Response) => {
    try {
      const { page, limit, skip, requested } = parsePagination(req.query, {
        page: 1,
        limit: 20,
        maxLimit: 100,
      });

      const pipeline: any[] = [
        {
          $group: {
            _id: "$studentEmail",
            totalPoints: { $sum: "$points" },
            studentName: { $first: "$studentName" },
            enrollmentNumber: { $first: "$enrollmentNumber" },
            badges: { $push: "$badges" }
          }
        },
        {
          $project: {
            studentEmail: "$_id",
            totalPoints: 1,
            studentName: 1,
            enrollmentNumber: 1,
            badges: {
              $reduce: {
                input: "$badges",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] }
              }
            }
          }
        },
        {
          $project: {
            studentEmail: 1,
            totalPoints: 1,
            studentName: 1,
            enrollmentNumber: 1,
            badges: {
              $filter: {
                input: { $setUnion: "$badges" },
                as: "badge",
                cond: { $ne: ["$$badge", null] }
              }
            }
          }
        },
        {
          $sort: { totalPoints: -1 }
        },
      ];

      if (requested) {
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
      } else {
        pipeline.push({ $limit: 20 });
      }

      // Get all students' total points and badges
      const allStudentPoints = await StudentPoints.aggregate(pipeline);

      if (requested) {
        const groupedTotals = await StudentPoints.aggregate([
          { $group: { _id: "$studentEmail" } },
          { $count: "total" },
        ]);
        const total = groupedTotals[0]?.total || 0;
        return res.json({
          items: allStudentPoints,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        });
      }

      res.json(allStudentPoints);
    } catch (error) {
      console.error("Failed to fetch global points leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch global points leaderboard" });
    }
  });

  // Delete student endpoint
  app.delete("/api/admin/students/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const student = await Student.findByIdAndDelete(id);
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      res.json({ success: true, message: `Student ${student.name} has been deleted`, studentId: id });
    } catch (error: any) {
      console.error("Error deleting student:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Test email endpoint (development only)
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/test/send-email", requireAuth, async (req: Request, res: Response) => {
      try {
        const { sendEmail } = await import("./services/emailService");
        const { to, subject, text, html } = req.body;

        if (!to || !subject || !text) {
          return res.status(400).json({ error: "Missing required fields: to, subject, text" });
        }

        await sendEmail({ to, subject, text, html });
        res.json({ success: true, message: "Email sent! Check terminal for preview URL." });
      } catch (error: any) {
        console.error("Test email failed:", error);
        res.status(500).json({ error: error.message || "Failed to send test email" });
      }
    });
  }

  // Catch-all route for debugging
  app.use("/api/clubs/:clubId/join", (req: Request, res: Response, next: NextFunction) => {
    console.log("Catch-all hit for join route:", req.method, req.path, req.params);
    next();
  });

  // Fallback route for SPA - serve index.html for all non-API routes
  // In production, serve from dist folder. In development, redirect to frontend server
  app.get("*", (_req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      const indexPath = path.join(process.cwd(), "..", "dist", "index.html");
      res.sendFile(indexPath, (err: NodeJS.ErrnoException | undefined) => {
        if (err) {
          console.error("Error sending index.html:", err);
          res.status(404).json({ error: "Not found" });
        }
      });
    } else {
      // In development, don't serve static files - let the Vite dev server handle it
      // Return JSON error instead since we're not serving HTML in dev mode
      res.status(404).json({ error: "Not found - use Vite dev server for frontend" });
    }
  });
}
