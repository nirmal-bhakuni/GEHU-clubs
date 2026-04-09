import mongoose from "mongoose";

const teacherAttendanceSchema = new mongoose.Schema({
  registrationId: { type: String, required: true, unique: true },
  teacherId: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "present", "absent", "late", "excused"],
    default: "pending",
  },
  participationScore: { type: Number, default: 0, min: 0, max: 10 },
  teacherRemark: { type: String, default: "" },
  sectionSnapshot: { type: String, default: "" },
  participatedAt: { type: Date, default: null },
}, { timestamps: true });

teacherAttendanceSchema.index({ teacherId: 1, updatedAt: -1 });
teacherAttendanceSchema.index({ status: 1, updatedAt: -1 });

export const TeacherAttendance = mongoose.model("TeacherAttendance", teacherAttendanceSchema);
