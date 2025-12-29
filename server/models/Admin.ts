import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  id: String,
  username: String,
  password: String,
  clubId: String,
  email: { type: String, default: "" },
  fullName: { type: String, default: "" },
  phone: { type: String, default: "" },
  lastLogin: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  role: { type: String, default: "club_admin" },
  permissions: {
    canCreateEvents: { type: Boolean, default: true },
    canManageMembers: { type: Boolean, default: true },
    canEditClub: { type: Boolean, default: true },
    canViewAnalytics: { type: Boolean, default: true }
  }
}, { timestamps: true });

export const Admin = mongoose.model("Admin", adminSchema);
