import mongoose from "mongoose";

const attendanceDisputeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    registrationId: { type: String, required: true },
    eventId: { type: String, required: true },
    eventTitle: { type: String, required: true },
    clubName: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    enrollmentNumber: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminResponse: { type: String, default: "" },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

attendanceDisputeSchema.index({ registrationId: 1, enrollmentNumber: 1 }, { unique: true });
attendanceDisputeSchema.index({ enrollmentNumber: 1, createdAt: -1 });
attendanceDisputeSchema.index({ status: 1, createdAt: -1 });

export const AttendanceDispute = mongoose.model("AttendanceDispute", attendanceDisputeSchema);
