import { randomUUID } from "crypto";
import { Admin } from "./models/Admin";
import { Club } from "./models/Club";
import { Event } from "./models/Event";
import { EventRegistration } from "./models/EventRegistration";
import { ClubMembership } from "./models/ClubMembership";
import { Achievement } from "./models/Achievement";
import { ClubLeadership } from "./models/ClubLeadership";
import StudentPoints from "./models/StudentPoints";

export const storage = {
  async getAdmin(id: string) {
    return await Admin.findOne({ id });
  },

  async getAdminByUsername(username: string) {
    return await Admin.findOne({ username });
  },

  async createAdmin(data: any) {
    data.id = randomUUID();
    const doc = new Admin(data);
    return await doc.save();
  },

  async getAllClubs() {
    return await Club.find();
  },

  async getClub(id: string) {
    return await Club.findOne({ id });
  },

  async createClub(data: any) {
    data.id = randomUUID();
    data.createdAt = new Date();
    const doc = new Club(data);
    return await doc.save();
  },

  async updateClub(id: string, updates: any) {
    return await Club.findOneAndUpdate({ id }, updates, { new: true });
  },

  async deleteClub(id: string) {
    const deleted = await Club.findOneAndDelete({ id });
    return deleted ? true : false;
  },

  async getAllEvents() {
    return await Event.find();
  },

  async getEvent(id: string) {
    return await Event.findOne({ id });
  },

  async getEventsByClub(clubId: string) {
    return await Event.find({ clubId });
  },

  async createEvent(data: any) {
    data.id = randomUUID();
    data.createdAt = new Date();
    const doc = new Event(data);
    return await doc.save();
  },

  async updateEvent(id: string, updates: any) {
    return await Event.findOneAndUpdate({ id }, updates, { new: true });
  },

  async deleteEvent(id: string) {
    const deleted = await Event.findOneAndDelete({ id });
    return deleted ? true : false;
  },

  async createEventRegistration(data: any) {
    data.id = randomUUID();
    data.registeredAt = new Date();
    const doc = new EventRegistration(data);
    return await doc.save();
  },

  async getEventRegistrationsByStudent(enrollmentNumber: string) {
    return await EventRegistration.find({ enrollmentNumber }).sort({ registeredAt: -1 });
  },

  async getEventRegistrationsByEvent(eventId: string) {
    return await EventRegistration.find({ eventId }).sort({ registeredAt: -1 });
  },

  async getAllEventRegistrations() {
    return await EventRegistration.find().sort({ registeredAt: -1 });
  },

  async createClubMembership(data: any) {
    data.id = randomUUID();
    data.joinedAt = new Date();
    const doc = new ClubMembership(data);
    return await doc.save();
  },

  async getClubMembershipsByStudent(enrollmentNumber: string) {
    return await ClubMembership.find({ enrollmentNumber }).sort({ joinedAt: -1 });
  },

  async getClubMembershipsByClub(clubId: string) {
    return await ClubMembership.find({ clubId }).sort({ joinedAt: -1 });
  },

  async updateClubMembershipStatus(id: string, status: string) {
    return await ClubMembership.findOneAndUpdate({ id }, { status }, { new: true });
  },

  async deleteClubMembership(id: string) {
    const deleted = await ClubMembership.findOneAndDelete({ id });
    return deleted ? true : false;
  },

  async incrementClubMemberCount(clubId: string) {
    return await Club.findOneAndUpdate({ id: clubId }, { $inc: { memberCount: 1 } }, { new: true });
  }
  ,
  async createAnnouncement(data: any) {
    data.id = randomUUID();
    data.createdAt = new Date();
    const { Announcement } = await import("./models/Announcement");
    const doc = new Announcement(data);
    return await doc.save();
  },

  async getAnnouncements(limit = 20) {
    const { Announcement } = await import("./models/Announcement");
    return await Announcement.find().sort({ createdAt: -1 }).limit(limit);
  }
  ,
  async markAnnouncementRead(announcementId: string, enrollmentNumber: string) {
    const { AnnouncementRead } = await import("./models/AnnouncementRead");
    // create record if not exists
    const exists = await AnnouncementRead.findOne({ announcementId, enrollmentNumber });
    if (exists) return exists;
    const doc = new AnnouncementRead({ id: randomUUID(), announcementId, enrollmentNumber, readAt: new Date() });
    return await doc.save();
  },

  async getAnnouncementsForStudent(enrollmentNumber: string, limit = 50) {
    const { Announcement } = await import("./models/Announcement");
    const { AnnouncementRead } = await import("./models/AnnouncementRead");
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(limit);
    const result = [] as any[];
    for (const a of announcements) {
      const read = await AnnouncementRead.findOne({ announcementId: a.id, enrollmentNumber });
      result.push({ ...a.toObject(), isRead: !!read });
    }
    return result;
  },

  async pinAnnouncement(id: string, pinned: boolean) {
    const { Announcement } = await import("./models/Announcement");
    return await Announcement.findOneAndUpdate({ id }, { pinned }, { new: true });
  },

  async deleteAnnouncement(id: string) {
    const { Announcement } = await import("./models/Announcement");
    const deleted = await Announcement.findOneAndDelete({ id });
    return deleted ? true : false;
  }
  ,
  async updateAnnouncement(id: string, updates: any) {
    const { Announcement } = await import("./models/Announcement");
    return await Announcement.findOneAndUpdate({ id }, updates, { new: true });
  },

  async createAchievement(data: any) {
    data.id = randomUUID();
    data.createdAt = new Date();
    const doc = new Achievement(data);
    return await doc.save();
  },

  async getAchievementsByClub(clubId: string) {
    return await Achievement.find({ clubId }).sort({ createdAt: -1 });
  },

  async getAllAchievements() {
    return await Achievement.find().sort({ createdAt: -1 });
  },

  async deleteAchievement(id: string) {
    const deleted = await Achievement.findOneAndDelete({ id });
    return deleted ? true : false;
  },

  async createClubLeadership(data: any) {
    data.id = randomUUID();
    data.assignedAt = new Date();
    const doc = new ClubLeadership(data);
    return await doc.save();
  },

  async getClubLeadershipByClub(clubId: string) {
    return await ClubLeadership.find({ clubId }).sort({ assignedAt: -1 });
  },

  async deleteClubLeadership(id: string) {
    const deleted = await ClubLeadership.findOneAndDelete({ id });
    return deleted ? true : false;
  },

  async getStudentPointsByClub(clubId: string) {
    return await StudentPoints.find({ clubId }).sort({ points: -1 });
  },

  async createOrUpdateStudentPoints(data: any) {
    const existing = await StudentPoints.findOne({ clubId: data.clubId, studentId: data.studentId });
    if (existing) {
      return await StudentPoints.findOneAndUpdate(
        { clubId: data.clubId, studentId: data.studentId },
        { ...data, lastUpdated: new Date() },
        { new: true }
      );
    } else {
      data.id = randomUUID();
      data.lastUpdated = new Date();
      const doc = new StudentPoints(data);
      return await doc.save();
    }
  },

  async updateStudentPoints(id: string, updates: any) {
    return await StudentPoints.findOneAndUpdate({ id }, { ...updates, lastUpdated: new Date() }, { new: true });
  },

  async awardAttendancePoints(clubId: string, studentId: string, studentData: any) {
    const attendancePoints = 10;
    
    const studentPoints = await StudentPoints.findOneAndUpdate(
      { clubId, studentId },
      {
        $inc: { points: attendancePoints },
        $set: {
          ...studentData,
          lastUpdated: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // Check for badges
    const badges = [];
    if (studentPoints.points >= 50) badges.push("Regular Attendee");
    if (studentPoints.points >= 100) badges.push("Active Member");
    if (studentPoints.points >= 200) badges.push("Club Champion");

    if (badges.length > 0) {
      studentPoints.badges = [...new Set([...(studentPoints.badges || []), ...badges])];
      await studentPoints.save();
    }

    return { studentPoints, pointsAwarded: attendancePoints, newBadges: badges.length > 0 ? badges : null };
  }
};
