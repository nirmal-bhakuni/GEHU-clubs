import mongoose from "mongoose";

const announcementReadSchema = new mongoose.Schema({
  id: String,
  announcementId: String,
  enrollmentNumber: String,
  readAt: Date
});

export const AnnouncementRead = mongoose.model("AnnouncementRead", announcementReadSchema);
