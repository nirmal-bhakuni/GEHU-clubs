import mongoose from "mongoose";

const clubRatingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    clubId: { type: String, required: true, index: true },
    enrollmentNumber: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);

clubRatingSchema.index({ clubId: 1, enrollmentNumber: 1 }, { unique: true });
clubRatingSchema.index({ clubId: 1, rating: -1 });

export const ClubRating = mongoose.model("ClubRating", clubRatingSchema);
