import { randomUUID } from "crypto";
import { Admin } from "./models/Admin";
import { Club } from "./models/Club";
import { Event } from "./models/Event";

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
  }
};
