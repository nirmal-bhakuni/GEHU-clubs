import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  id: String,
  title: String,
  content: String,
  authorId: String,
  authorName: String,
  target: { type: String, default: "all" }, // 'all' or clubId
  createdAt: Date,
  pinned: { type: Boolean, default: false }
});

export const Announcement = mongoose.model("Announcement", announcementSchema);
