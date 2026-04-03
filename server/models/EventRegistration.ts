import mongoose from "mongoose";

const eventRegistrationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  eventDate: { type: String, required: true },
  eventTime: { type: String, required: true },
  clubName: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  enrollmentNumber: { type: String, required: true },
  phone: { type: String, required: true },
  rollNumber: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  interests: [{ type: String }],
  experience: { type: String },
  attended: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  attendanceStatus: { type: String, enum: ['pending', 'present', 'absent'], default: 'pending' },
  attendanceMarkedAt: { type: Date },
  attendanceMarkedBy: { type: String },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

eventRegistrationSchema.index({ eventId: 1, registeredAt: -1 });
eventRegistrationSchema.index({ eventId: 1, status: 1, registeredAt: -1 });
eventRegistrationSchema.index({ eventId: 1, attendanceStatus: 1, registeredAt: -1 });
eventRegistrationSchema.index({ enrollmentNumber: 1 });
eventRegistrationSchema.index({ studentEmail: 1 });

export const EventRegistration = mongoose.model("EventRegistration", eventRegistrationSchema);