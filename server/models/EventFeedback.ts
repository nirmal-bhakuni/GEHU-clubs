import mongoose from "mongoose";

const eventFeedbackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  enrollmentNumber: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

eventFeedbackSchema.index({ eventId: 1, submittedAt: -1 });
eventFeedbackSchema.index({ eventId: 1, enrollmentNumber: 1 }, { unique: true });

export const EventFeedback = mongoose.model("EventFeedback", eventFeedbackSchema);