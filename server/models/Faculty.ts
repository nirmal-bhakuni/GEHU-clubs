import mongoose from "mongoose";
import { randomUUID } from "crypto";

const facultySchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID(), index: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    department: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    idProofUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    // Access control fields
    isBlocked: { type: Boolean, default: false, index: true },
    blockedAt: { type: Date, default: null },
    blockedReason: { type: String, default: "" },
    blockedBy: { type: String, default: "" }, // admin ID who blocked
  },
  { timestamps: true },
);

facultySchema.index({ email: 1 }, { unique: true });
facultySchema.index({ status: 1, createdAt: -1 });

export const Faculty = mongoose.model("Faculty", facultySchema);
