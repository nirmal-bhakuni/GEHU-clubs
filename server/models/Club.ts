import mongoose from "mongoose";

const clubSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  category: String,
  facultyAssigned: String,
  phone: String,
  email: String,
  eligibility: String,
  eligibilityYears: [String],
  memberCount: Number,
  logoUrl: String,
  coverImageUrl: String,
  isHighlighted: { type: Boolean, default: false },
  isFrozen: { type: Boolean, default: false },
  frozenAt: Date,
  frozenBy: String,
  createdAt: Date
});

export const Club = mongoose.model("Club", clubSchema);
