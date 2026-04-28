import mongoose from "mongoose";
import { randomUUID } from "crypto";

const driveSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    deadline: { type: Date, required: true, index: true },
    allowedFileTypes: [{ type: String, required: true }],
    maxFileSize: { type: Number, required: true }, // bytes
    createdBy: { type: String, required: true, index: true }, // facultyId
    targetCourse: { type: String, required: true, trim: true, index: true },
    targetSection: { type: String, required: true, trim: true, index: true },
    allowMultipleSubmissions: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

driveSchema.index({ createdBy: 1, createdAt: -1 });
driveSchema.index({ targetCourse: 1, targetSection: 1, createdAt: -1 });

export const Drive = mongoose.model("Drive", driveSchema);
