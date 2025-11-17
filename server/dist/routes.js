"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const storage_1 = require("./storage");
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const multer_1 = __importDefault(require("multer"));
const schema_1 = require("./shared/schema");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadsDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage_multer = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    }
});
const upload = (0, multer_1.default)({
    storage: storage_multer,
    limits: { fileSize: 5 * 1024 * 1024 }
});
function requireAuth(req, res, next) {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}
async function registerRoutes(app) {
    app.use("/uploads", express_1.default.static(uploadsDir));
    app.post("/api/auth/login", async (req, res) => {
        try {
            const { username, password } = req.body;
            const admin = await storage_1.storage.getAdminByUsername(username);
            if (!admin) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
            const isValid = await bcryptjs_1.default.compare(password, admin.password);
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
        }
        catch (error) {
            res.status(500).json({ error: "Login failed" });
        }
    });
    app.post("/api/auth/logout", (req, res) => {
        req.session.destroy((err) => {
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
        const admin = await storage_1.storage.getAdmin(req.session.adminId);
        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }
        res.json({
            id: admin.id,
            username: admin.username,
            clubId: admin.clubId
        });
    });
    app.get("/api/clubs", async (req, res) => {
        try {
            const { search, category } = req.query;
            let clubs = await storage_1.storage.getAllClubs();
            if (search && typeof search === "string") {
                const s = search.toLowerCase();
                clubs = clubs.filter(c => c.name.toLowerCase().includes(s) ||
                    c.description.toLowerCase().includes(s));
            }
            if (category && typeof category === "string" && category !== "all") {
                clubs = clubs.filter(c => c.category === category);
            }
            res.json(clubs);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch clubs" });
        }
    });
    app.get("/api/clubs/:id", async (req, res) => {
        try {
            const club = await storage_1.storage.getClub(req.params.id);
            if (!club) {
                return res.status(404).json({ error: "Club not found" });
            }
            res.json(club);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch club" });
        }
    });
    app.post("/api/clubs", requireAuth, async (req, res) => {
        try {
            const validatedData = schema_1.insertClubSchema.parse(req.body);
            const club = await storage_1.storage.createClub(validatedData);
            res.status(201).json(club);
        }
        catch (error) {
            res.status(400).json({ error: "Invalid club data" });
        }
    });
    app.patch("/api/clubs/:id", requireAuth, async (req, res) => {
        try {
            const club = await storage_1.storage.updateClub(req.params.id, req.body);
            if (!club) {
                return res.status(404).json({ error: "Club not found" });
            }
            res.json(club);
        }
        catch (error) {
            res.status(400).json({ error: "Failed to update club" });
        }
    });
    app.delete("/api/clubs/:id", requireAuth, async (req, res) => {
        try {
            const success = await storage_1.storage.deleteClub(req.params.id);
            if (!success) {
                return res.status(404).json({ error: "Club not found" });
            }
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to delete club" });
        }
    });
    app.get("/api/events", async (req, res) => {
        try {
            const { clubId, search, category } = req.query;
            let events;
            if (clubId && typeof clubId === "string") {
                events = await storage_1.storage.getEventsByClub(clubId);
            }
            else {
                events = await storage_1.storage.getAllEvents();
            }
            if (search && typeof search === "string") {
                const s = search.toLowerCase();
                events = events.filter(e => e.title.toLowerCase().includes(s) ||
                    e.description.toLowerCase().includes(s));
            }
            if (category && typeof category === "string" && category !== "all") {
                events = events.filter(e => e.category === category);
            }
            res.json(events);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch events" });
        }
    });
    app.get("/api/events/:id", async (req, res) => {
        try {
            const event = await storage_1.storage.getEvent(req.params.id);
            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }
            res.json(event);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch event" });
        }
    });
    app.post("/api/events", requireAuth, upload.single("image"), async (req, res) => {
        try {
            const admin = await storage_1.storage.getAdmin(req.session.adminId);
            if (!admin?.clubId) {
                return res.status(403).json({ error: "Admin must be assigned to a club" });
            }
            const eventData = {
                ...req.body,
                clubId: admin.clubId,
                imageUrl: req.file ? `/uploads/${req.file.filename}` : null
            };
            const validated = schema_1.insertEventSchema.parse(eventData);
            const event = await storage_1.storage.createEvent(validated);
            res.status(201).json(event);
        }
        catch (error) {
            res.status(400).json({ error: "Invalid event data" });
        }
    });
    app.patch("/api/events/:id", requireAuth, upload.single("image"), async (req, res) => {
        try {
            const existingEvent = await storage_1.storage.getEvent(req.params.id);
            if (!existingEvent) {
                return res.status(404).json({ error: "Event not found" });
            }
            const admin = await storage_1.storage.getAdmin(req.session.adminId);
            if (!admin?.clubId) {
                return res.status(403).json({ error: "Admin must be assigned to a club" });
            }
            if (existingEvent.clubId !== admin.clubId) {
                return res.status(403).json({ error: "Not authorized" });
            }
            const { clubId, ...safeUpdates } = req.body;
            const updates = {
                ...safeUpdates,
                ...(req.file && { imageUrl: `/uploads/${req.file.filename}` })
            };
            const event = await storage_1.storage.updateEvent(req.params.id, updates);
            res.json(event);
        }
        catch (error) {
            res.status(400).json({ error: "Failed to update event" });
        }
    });
    app.delete("/api/events/:id", requireAuth, async (req, res) => {
        try {
            const existingEvent = await storage_1.storage.getEvent(req.params.id);
            if (!existingEvent) {
                return res.status(404).json({ error: "Event not found" });
            }
            const admin = await storage_1.storage.getAdmin(req.session.adminId);
            if (!admin?.clubId) {
                return res.status(403).json({ error: "Admin must be assigned to a club" });
            }
            if (existingEvent.clubId !== admin.clubId) {
                return res.status(403).json({ error: "Not authorized" });
            }
            const success = await storage_1.storage.deleteEvent(req.params.id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to delete event" });
        }
    });
    app.post("/api/auth/register", requireAuth, async (req, res) => {
        try {
            const { username, password, clubId } = req.body;
            const creator = await storage_1.storage.getAdmin(req.session.adminId);
            if (!creator?.clubId) {
                return res.status(403).json({ error: "Admin must be assigned to a club" });
            }
            if (clubId !== creator.clubId) {
                return res.status(403).json({ error: "Can only create admins for your club" });
            }
            const existing = await storage_1.storage.getAdminByUsername(username);
            if (existing) {
                return res.status(400).json({ error: "Username already exists" });
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            const admin = await storage_1.storage.createAdmin({
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
        }
        catch (error) {
            res.status(400).json({ error: "Registration failed" });
        }
    });
    const httpServer = (0, http_1.createServer)(app);
    return httpServer;
}
