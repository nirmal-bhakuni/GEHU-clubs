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
import { Admin } from "./models/Admin";

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

export async function registerRoutes(app: Express): Promise<void> {
  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      if (!admin) return res.status(401).json({ error: "Invalid credentials" });

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
        branch,
        lastLogin: new Date()
      });

      req.session.studentId = student._id;

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

      res.json({
        success: true,
        student: {
          id: student._id,
          name: student.name,
          enrollment: student.enrollment,
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
      branch: student.branch
    });
  });

  app.get("/api/students/count", requireAuth, async (req: Request, res: Response) => {
    try {
      const count = await Student.countDocuments();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get student count" });
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

      // Create registration with event details
      const registration = await storage.createEventRegistration({
        ...registrationData,
        eventId,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        clubName: event.clubName,
      });

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

  // Club Membership Routes
  app.post("/api/clubs/:clubId/join", async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const membershipData = req.body;

      console.log("Join request received:", { clubId, membershipData });

      // Get club details
      const club = await storage.getClub(clubId);
      if (!club) {
        console.log("Club not found:", clubId);
        return res.status(404).json({ error: "Club not found" });
      }

      // Create membership with club details and mapped field names
      const membership = await storage.createClubMembership({
        studentName: membershipData.name,
        studentEmail: membershipData.email,
        enrollmentNumber: membershipData.enrollmentNumber,
        department: membershipData.department,
        reason: membershipData.reason,
        clubId,
        clubName: club.name,
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

  // Club Admin Routes for Membership Management
  app.get("/api/admin/club-memberships/:clubId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const memberships = await storage.getClubMembershipsByClub(clubId);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memberships" });
    }
  });

  app.patch("/api/admin/club-memberships/:membershipId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { membershipId } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const membership = await storage.updateClubMembershipStatus(membershipId, status);
      if (!membership) return res.status(404).json({ error: "Membership not found" });

      // Update club member count if membership is approved
      if (status === 'approved') {
        await storage.incrementClubMemberCount(membership.clubId);
      }

      res.json(membership);
    } catch (error) {
      res.status(500).json({ error: "Failed to update membership status" });
    }
  });

  // Analytics Endpoints
  app.get("/api/analytics/overview", requireAuth, async (req: Request, res: Response) => {
    try {
      const [clubs, events, students] = await Promise.all([
        storage.getAllClubs(),
        storage.getAllEvents(),
        Student.find({}).select('id name email enrollment branch lastLogin isDisabled')
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

      res.json({
        statusBreakdown: { upcoming, past },
        monthlyTrends: monthlyData
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
}
