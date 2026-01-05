import type { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as Express from "express";
import express from "express";
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

export async function registerRoutes(app: Express): Promise<void> {
  app.use("/uploads", express.static(uploadsDir));

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
        return {
          ...clubObj,
          memberCount: memberCountMap.get(club.id) || 0
        };
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
      res.status(500).json({ error: "Failed to fetch clubs" });
    }
  });

  app.get("/api/clubs/:id", async (req: Request, res: Response) => {
    try {
      const club = await storage.getClub(req.params.id);
      if (!club) return res.status(404).json({ error: "Club not found" });
      
      // Get actual member count from club memberships
      const actualMemberCount = await storage.getClubMemberCount(club.id);
      const clubObj = club.toObject ? club.toObject() : club;
      
      res.json({
        ...clubObj,
        memberCount: actualMemberCount
      });
    } catch (error) {
      console.error("Error fetching club:", error);
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

  app.post("/api/events", requireClubOwnership, upload.single("image"), async (req: Request, res: Response) => {
    try {
      const admin = (req as any).admin;
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

  app.patch("/api/events/:id", requireClubOwnership, upload.single("image"), async (req: Request, res: Response) => {
    try {
      const oldEvent = await storage.getEvent(req.params.id);
      if (!oldEvent) return res.status(404).json({ error: "Event not found" });

      const admin = (req as any).admin;
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
        branch,
        lastLogin: new Date()
      });

      req.session.studentId = student._id;
      req.session.studentEmail = student.email;

      res.json({
        success: true,
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          enrollment: student.enrollment,
          branch: student.branch,
          lastLogin: student.lastLogin
        }
      });
    } catch {
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
  app.get("/api/student/announcements", async (req: Request, res: Response) => {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });
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
  app.post("/api/student/announcements/:id/read", async (req: Request, res: Response) => {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });
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

      req.session.studentId = student._id;
      req.session.studentEmail = student.email;

      res.json({
        success: true,
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          enrollment: student.enrollment,
          branch: student.branch,
          lastLogin: student.lastLogin
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

  app.get("/api/student/me", async (req: Request, res: Response) => {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

    const student = await Student.findById(req.session.studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    res.json({
      id: student._id,
      name: student.name,
      email: student.email,
      enrollment: student.enrollment,
      branch: student.branch,
      profilePicture: student.profilePicture || null
    });
  });

  // Student: Upload profile picture
  app.post("/api/student/profile-picture", upload.single("profilePicture"), async (req: Request, res: Response) => {
    try {
      if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Update student profile with image URL
      await Student.findByIdAndUpdate(req.session.studentId, {
        profilePicture: imageUrl
      });

      res.json({ 
        success: true, 
        imageUrl,
        message: "Profile picture uploaded successfully" 
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  });

  // Student: Get certificates
  app.get("/api/student/certificates", async (req: Request, res: Response) => {
    try {
      if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

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
  // Admin: list students who have logged in (lastLogin present)
  app.get("/api/admin/students", requireAuth, async (req: Request, res: Response) => {
    try {
      const students = await Student.find({ lastLogin: { $exists: true, $ne: null } }).sort({ lastLogin: -1 });
      const payload = students.map(s => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        enrollment: s.enrollment,
        branch: s.branch,
        lastLogin: s.lastLogin,
        isDisabled: s.isDisabled,
        createdAt: s.createdAt
      }));
      res.json(payload);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
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

  app.get("/api/student/registrations", async (req: Request, res: Response) => {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

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

  // Test route
  app.get("/api/test-join", (req: Request, res: Response) => {
    res.json({ message: "Test route works" });
  });

  // Club Membership Routes
  console.log("Registering club join route: /api/clubs/:clubId/join");
  app.post("/api/clubs/:clubId/join", async (req: Request, res: Response) => {
    console.log("Join route hit:", req.path, req.params, req.body, req.method, req.headers['content-type']);
    console.log("ClubId from params:", req.params.clubId);

    try {
      // Check if student is authenticated
      if (!req.session.studentId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

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
        department: student.branch,
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

  app.get("/api/student/club-memberships", async (req: Request, res: Response) => {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

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

      const studentPoints = await StudentPoints.find({ clubId }).sort({ points: -1 });
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

      const registrations = await EventRegistration.find({ clubName: { $exists: true } }).populate('eventId');

      // Filter registrations for events of this club
      const clubEvents = await storage.getAllEvents();
      const clubEventIds = clubEvents.filter(e => e.clubId === clubId).map(e => e.id);

      const filteredRegistrations = registrations.filter(r => clubEventIds.includes(r.eventId));

      res.json(filteredRegistrations);
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
        Student.find({}).select('id name email enrollment branch lastLogin isDisabled'),
        ClubMembership.find({ status: 'approved' }).select('joinedAt clubId')
      ]);

      const totalStudents = students.length;
      const activeStudents = students.filter(s => !s.isDisabled).length;
      const totalClubs = clubs.length;
      const activeClubs = clubs.filter(c => (c.memberCount || 0) > 0).length;
      const totalEvents = events.length;
      const upcomingEvents = events.filter(e => new Date(e.date || new Date()) > new Date()).length;

      // Club categories distribution
      const clubCategories = clubs.reduce((acc: Record<string, number>, club) => {
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
      const topClubs = clubs
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
      const students = await Student.find({}).select('branch enrollment lastLogin isDisabled');

      // Branch distribution
      const branchDistribution = students.reduce((acc: Record<string, number>, student) => {
        const branch = student.branch || 'Unknown';
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
  app.get("/api/student/points", async (req: Request, res: Response) => {
    if (!req.session.studentId) return res.status(401).json({ error: "Not authenticated" });

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
      // Get all students' total points and badges
      const allStudentPoints = await StudentPoints.aggregate([
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
        {
          $limit: 20
        }
      ]);

      res.json(allStudentPoints);
    } catch (error) {
      console.error("Failed to fetch global points leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch global points leaderboard" });
    }
  });

  // Catch-all route for debugging
  app.use("/api/clubs/:clubId/join", (req: Request, res: Response, next: NextFunction) => {
    console.log("Catch-all hit for join route:", req.method, req.path, req.params);
    next();
  });
}
