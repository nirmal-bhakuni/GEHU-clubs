import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  enrollment: { type: String, required: true, unique: true },
  branch: { type: String, required: true },
  password: { type: String, required: true },
  lastLogin: { type: Date, required: false },
  isDisabled: { type: Boolean, default: false },
  profilePicture: { type: String, required: false },
  certificates: [{
    title: { type: String, required: true },
    issuedBy: { type: String, required: true },
    issuedDate: { type: Date, required: true },
    certificateUrl: { type: String, required: true },
  }],
}, { timestamps: true });

export const Student = mongoose.model("Student", studentSchema);
