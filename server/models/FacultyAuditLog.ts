import mongoose from "mongoose";
import { randomUUID } from "crypto";

const facultyAuditLogSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID(), index: true, unique: true },
    facultyId: { type: String, required: true, index: true },
    facultyEmail: { type: String, required: true },
    action: {
      type: String,
      enum: ["registered", "approved", "rejected", "blocked", "unblocked"],
      required: true,
      index: true,
    },
    performedBy: { type: String, required: true }, // admin ID
    performedByEmail: { type: String, default: "" },
    reason: { type: String, default: "" },
    metadata: {
      oldStatus: { type: String, default: "" },
      newStatus: { type: String, default: "" },
      ipAddress: { type: String, default: "" },
      userAgent: { type: String, default: "" },
    },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

// Index for common queries
facultyAuditLogSchema.index({ facultyId: 1, timestamp: -1 });
facultyAuditLogSchema.index({ action: 1, timestamp: -1 });
facultyAuditLogSchema.index({ performedBy: 1, timestamp: -1 });

export const FacultyAuditLog = mongoose.model(
  "FacultyAuditLog",
  facultyAuditLogSchema
);
