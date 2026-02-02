import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  rollNumber: { type: String, required: false, unique: true, sparse: true },
  enrollment: { type: String, required: true, unique: true },
  department: { type: String, required: false },
  yearOfAdmission: { type: Number, required: false },
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
