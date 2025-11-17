"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = void 0;
const crypto_1 = require("crypto");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class MemStorage {
    constructor() {
        this.admins = new Map();
        this.clubs = new Map();
        this.events = new Map();
        this.seedData().catch(console.error);
    }
    async seedData() {
        // Create sample clubs first
        const techClubId = (0, crypto_1.randomUUID)();
        this.clubs.set(techClubId, {
            id: techClubId,
            name: "IEEE",
            description: "Building innovative solutions and learning cutting-edge technologies together through hackathons and workshops.",
            category: "Technology",
            memberCount: 125,
            logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGCvDLx2YLXsTqnLYhQPbyv6wDRXXhNkU7ww&s",
            createdAt: new Date(),
        });
        const debateClubId = (0, crypto_1.randomUUID)();
        this.clubs.set(debateClubId, {
            id: debateClubId,
            name: "ARYAVRAT",
            description: "Sharpen your argumentation skills and engage in intellectual discourse on current affairs.",
            category: "Academic",
            memberCount: 85,
            logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHSQ26pPoXAi8YKQZQPoLwPeETRdh9ywhCAQ&s",
            createdAt: new Date(),
        });
        const artClubId = (0, crypto_1.randomUUID)();
        this.clubs.set(artClubId, {
            id: artClubId,
            name: "PAPERTECH-GEHU",
            description: "Express yourself through various art forms including painting, sculpture, and digital art.",
            category: "Arts",
            memberCount: 95,
            logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4okYreu0Yak1U5bjkWeSCRBUuagbLTanHg&s",
            createdAt: new Date(),
        });
        const businessClubId = (0, crypto_1.randomUUID)();
        this.clubs.set(businessClubId, {
            id: businessClubId,
            name: "Entrepreneurship Hub",
            description: "Connect with fellow entrepreneurs, develop business ideas, and learn from industry experts.",
            category: "Business",
            memberCount: 150,
            logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkdkjI3VT0FR0WkyDb_xIOPfPpoULRDPybNA&s",
            createdAt: new Date(),
        });
        const scienceClubId = (0, crypto_1.randomUUID)();
        this.clubs.set(scienceClubId, {
            id: scienceClubId,
            name: "CODE_HUNTERS",
            description: "Discover the wonders of science through experiments, research projects, and field trips.",
            category: "Academic",
            memberCount: 110,
            logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
            createdAt: new Date(),
        });
        const socialClubId = (0, crypto_1.randomUUID)();
        this.clubs.set(socialClubId, {
            id: socialClubId,
            name: "RANGMANCH",
            description: "Make a difference in our community through volunteer work and social initiatives.",
            category: "Social",
            memberCount: 175,
            logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxB5o3X1zEYYTEL6XAalXWOiubGY_mrVJCvA&s",
            createdAt: new Date(),
        });
        // Create sample admin assigned to Tech Club (password: admin123)
        const adminId = (0, crypto_1.randomUUID)();
        const hashedPassword = await bcryptjs_1.default.hash("admin123", 10);
        this.admins.set(adminId, {
            id: adminId,
            username: "admin",
            password: hashedPassword,
            clubId: techClubId, // Assign to Tech Club
        });
        // Create sample events
        const event1Id = (0, crypto_1.randomUUID)();
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
            createdAt: new Date(),
        });
        const event2Id = (0, crypto_1.randomUUID)();
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
            createdAt: new Date(),
        });
        const event3Id = (0, crypto_1.randomUUID)();
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
            imageUrl: "https://images.unsplash.com/photo-1525921429624-479b6a26d84d", // Debate image
            createdAt: new Date(),
        });
        const event4Id = (0, crypto_1.randomUUID)();
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
            createdAt: new Date(),
        });
        const event5Id = (0, crypto_1.randomUUID)();
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
            imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c", // Hackathon image
            createdAt: new Date(),
        });
    }
    // Admin operations
    async getAdmin(id) {
        return this.admins.get(id);
    }
    async getAdminByUsername(username) {
        return Array.from(this.admins.values()).find((admin) => admin.username === username);
    }
    async createAdmin(insertAdmin) {
        const id = (0, crypto_1.randomUUID)();
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
        const id = (0, crypto_1.randomUUID)();
        const club = {
            ...insertClub,
            id,
            memberCount: insertClub.memberCount ?? 0,
            logoUrl: insertClub.logoUrl ?? null,
            createdAt: new Date()
        };
        this.clubs.set(id, club);
        return club;
    }
    async updateClub(id, updates) {
        const club = this.clubs.get(id);
        if (!club)
            return undefined;
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
        return Array.from(this.events.values()).filter((event) => event.clubId === clubId);
    }
    async createEvent(insertEvent) {
        const id = (0, crypto_1.randomUUID)();
        const event = {
            ...insertEvent,
            id,
            imageUrl: insertEvent.imageUrl ?? null,
            createdAt: new Date()
        };
        this.events.set(id, event);
        return event;
    }
    async updateEvent(id, updates) {
        const event = this.events.get(id);
        if (!event)
            return undefined;
        const updatedEvent = { ...event, ...updates };
        this.events.set(id, updatedEvent);
        return updatedEvent;
    }
    async deleteEvent(id) {
        return this.events.delete(id);
    }
}
exports.MemStorage = MemStorage;
exports.storage = new MemStorage();
