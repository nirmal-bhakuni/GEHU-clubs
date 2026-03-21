import mongoose from "mongoose";

const chatReadStateSchema = new mongoose.Schema(
  {
    chatGroupId: { type: String, required: true, index: true },
    userKey: { type: String, required: true, index: true },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

chatReadStateSchema.index({ chatGroupId: 1, userKey: 1 }, { unique: true });

export const ChatReadState = mongoose.model("ChatReadState", chatReadStateSchema);
