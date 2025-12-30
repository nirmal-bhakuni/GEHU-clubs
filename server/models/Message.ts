import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  id: String,
  clubId: String,
  senderName: String,
  senderEmail: String,
  enrollmentNumber: String,
  subject: String,
  message: String,
  sentAt: Date,
  read: { type: Boolean, default: false }
});

export const Message = mongoose.model("Message", messageSchema);