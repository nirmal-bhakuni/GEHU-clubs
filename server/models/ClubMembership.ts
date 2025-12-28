import mongoose from "mongoose";

const clubMembershipSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  clubId: { type: String, required: true },
  clubName: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  enrollmentNumber: { type: String, required: true },
  department: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const ClubMembership = mongoose.model("ClubMembership", clubMembershipSchema);