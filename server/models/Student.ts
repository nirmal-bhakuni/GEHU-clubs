import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  clubId: String,
  joinedAt: Date
});

export const Student = mongoose.model("Student", studentSchema);
