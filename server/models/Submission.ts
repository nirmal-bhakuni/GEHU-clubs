import mongoose from "mongoose";
import { randomUUID } from "crypto";

const submissionSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    driveId: { type: String, required: true, index: true },
    studentDetails: {
      name: { type: String, required: true, trim: true },
      section: { type: String, required: true, trim: true },
      department: { type: String, required: true, trim: true },
      year: { type: Number, required: true },
    },
    eventCategory: { type: String, required: true, trim: true },
    certificateUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now, index: true },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: null },
  },
  { timestamps: true },
);

submissionSchema.index({ driveId: 1, submittedAt: -1 });

export const Submission = mongoose.model("Submission", submissionSchema);
