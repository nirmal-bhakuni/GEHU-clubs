import mongoose from "mongoose";

const chatGroupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["club", "event"], required: true },
    clubId: { type: String },
    eventId: { type: String },
    createdByType: { type: String, enum: ["student", "admin"], required: true },
    createdById: { type: String, required: true },
    adminOnlyMessaging: { type: Boolean, default: false },
    blockedUserKeys: { type: [String], default: [] },
    isFrozen: { type: Boolean, default: false },
    frozenAt: { type: Date },
    frozenBy: { type: String },
  },
  { timestamps: true }
);

chatGroupSchema.index({ type: 1, clubId: 1 });
chatGroupSchema.index({ type: 1, eventId: 1 });

export const ChatGroup = mongoose.model("ChatGroup", chatGroupSchema);
