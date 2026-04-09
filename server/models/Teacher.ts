import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: "" },
  email: { type: String, default: "" },
  department: { type: String, default: "" },
  designation: { type: String, default: "Faculty Mentor" },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

teacherSchema.index({ username: 1 }, { unique: true });

export const Teacher = mongoose.model("Teacher", teacherSchema);
