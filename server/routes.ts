import express from "express";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import multer from "multer";
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

import {
  insertAdminSchema,
  insertClubSchema,
  insertEventSchema
} from "./shared/schema";

/* -------------------- UPLOAD SETUP -------------------- */

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`)
});

const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* -------------------- AUTH MIDDLEWARE -------------------- */

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

async function requireClubOwnership(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const admin = await storage.getAdmin(req.session.adminId);
    if (!admin || !admin.clubId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const clubId = req.params.clubId || req.body?.clubId;
    if (clubId && admin.clubId !== clubId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    (req as any).admin = admin;
    next();
  } catch (err) {
    console.error("Authorization error:", err);
    res.status(500).json({ error: "Authorization failed" });
  }
}

/* ======================================================
   ✅ FIXED FUNCTION SIGNATURE (MAIN FIX)
====================================================== */

export async function registerRoutes(
  app: express.Application
): Promise<void> {

  app.use("/uploads", express.static(uploadsDir));

  /* -------------------- FILE UPLOAD -------------------- */

  app.post(
    "/api/upload",
    requireAuth,
    upload.single("file"),
    async (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      res.json({
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename
      });
    }
  );

  /* -------------------- AUTH ROUTES -------------------- */

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      if (!admin || !admin.clubId) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      res.json({ success: true, admin });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  /* -------------------- CLUB JOIN -------------------- */

  console.log("Registering club join route: /api/clubs/:clubId/join");

  app.post("/api/clubs/:clubId/join", async (req: Request, res: Response) => {
    try {
      if (!req.session.studentId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const club = await storage.getClub(req.params.clubId);
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }

      const student = await Student.findById(req.session.studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      const exists = await ClubMembership.findOne({
        enrollmentNumber: student.enrollment,
        clubId: club.id
      });

      if (exists) {
        return res.status(400).json({ error: "Request already exists" });
      }

      const membership = await storage.createClubMembership({
        studentName: student.name,
        studentEmail: student.email,
        enrollmentNumber: student.enrollment,
        department: student.branch,
        reason: req.body.reason,
        clubId: club.id,
        clubName: club.name,
        status: "pending"
      });

      res.json({ success: true, membership });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Join failed" });
    }
  });

  /* -------------------- TEST ROUTE -------------------- */

  app.get("/api/test-join", (_req: Request, res: Response) => {
    res.json({ message: "Test route works" });
  });
}
