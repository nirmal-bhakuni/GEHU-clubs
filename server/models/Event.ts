import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  date: String,
  time: String,
  location: String,
  category: String,
  clubId: String,
  clubName: String,
  imageUrl: String,
  createdEmailSentAt: Date,
  upcomingEmailSentAt: Date,
  createdAt: Date
});

export const Event = mongoose.model("Event", eventSchema);
