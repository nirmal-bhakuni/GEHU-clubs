import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  rollNumber: { type: String, required: false, unique: true, sparse: true },
  enrollment: { type: String, required: true, unique: true },
  department: { type: String, required: false },
  yearOfAdmission: { type: Number, required: false },
  currentSemester: { type: String, required: false, default: "" },
  password: { type: String, required: true },
  lastLogin: { type: Date, required: false },
  isDisabled: { type: Boolean, default: false },
  profilePicture: { type: String, required: false },
  notificationPreferences: {
    eventReminders: { type: Boolean, default: true },
    attendanceUpdates: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true },
    certificates: { type: Boolean, default: true },
  },
  dismissedReminderIds: [{ type: String }],
  savedEventIds: [{ type: String }],
  savedClubIds: [{ type: String }],
  certificates: [{
    title: { type: String, required: true },
    issuedBy: { type: String, required: true },
    issuedDate: { type: Date, required: true },
    certificateUrl: { type: String, required: true },
  }],
}, { timestamps: true });

export const Student = mongoose.model("Student", studentSchema);
