import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  date: String,
  time: String,
  durationMinutes: {
    type: Number,
    default: 120,
  },
  location: String,
  category: String,
  clubId: String,
  clubName: String,
  imageUrl: String,
  createdEmailSentAt: Date,
  upcomingEmailSentAt: Date,
  createdAt: Date
});

eventSchema.index({ clubId: 1, createdAt: -1 });
eventSchema.index({ clubId: 1, date: 1 });

export const Event = mongoose.model("Event", eventSchema);
