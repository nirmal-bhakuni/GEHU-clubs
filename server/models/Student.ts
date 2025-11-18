import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  enrollment: { type: String, required: true, unique: true },
  branch: { type: String, required: true },
  password: { type: String, required: true },
}, { timestamps: true });

export const Student = mongoose.model("Student", studentSchema);
