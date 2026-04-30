import mongoose from "mongoose";
import { randomUUID } from "crypto";

const invalidatedTokenSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID(), index: true, unique: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    facultyId: { type: String, required: true, index: true },
    reason: {
      type: String,
      enum: ["faculty_blocked", "faculty_removed", "manual_logout", "password_changed"],
      default: "faculty_blocked",
    },
    invalidatedAt: { type: Date, default: () => new Date(), index: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },
  },
  { timestamps: false }
);

// TTL index to automatically remove documents after 30 days
invalidatedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InvalidatedToken = mongoose.model(
  "InvalidatedToken",
  invalidatedTokenSchema
);
