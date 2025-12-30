import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  clubId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  achievementDate: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Achievement = mongoose.model("Achievement", achievementSchema);