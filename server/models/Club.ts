import mongoose from "mongoose";

const clubSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  category: String,
  memberCount: Number,
  logoUrl: String,
  coverImageUrl: String,
  createdAt: Date
});

export const Club = mongoose.model("Club", clubSchema);
