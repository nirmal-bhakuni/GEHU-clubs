import mongoose from "mongoose";

const clubLeadershipSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  clubId: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const ClubLeadership = mongoose.model("ClubLeadership", clubLeadershipSchema);