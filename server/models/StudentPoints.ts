import mongoose from "mongoose";

const studentPointsSchema = new mongoose.Schema({
  clubId: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentEmail: {
    type: String,
    required: true,
  },
  enrollmentNumber: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  badges: [{
    type: String,
  }],
  skills: [{
    type: String,
  }],
  lastAwardReason: {
    type: String,
    default: "",
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure one record per student per club
studentPointsSchema.index({ clubId: 1, studentId: 1 }, { unique: true });
studentPointsSchema.index({ clubId: 1, points: -1 });
studentPointsSchema.index({ studentEmail: 1 });

export default mongoose.model("StudentPoints", studentPointsSchema);