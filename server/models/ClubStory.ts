import mongoose from "mongoose";

const clubStorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  clubId: { type: String, required: true, index: true },
  clubName: { type: String, required: true },
  mediaUrl: { type: String, required: true },
  caption: { type: String, default: "" },
  isHighlight: { type: Boolean, default: false },
  expiresAt: { type: Date },
  createdByAdminId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

clubStorySchema.index({ clubId: 1, createdAt: -1 });
clubStorySchema.index({ isHighlight: 1, createdAt: -1 });

export const ClubStory = mongoose.model("ClubStory", clubStorySchema);
