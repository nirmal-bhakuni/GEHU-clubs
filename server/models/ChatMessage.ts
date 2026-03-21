import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    chatGroupId: { type: String, required: true, index: true },
    senderType: { type: String, enum: ["student", "admin"], required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    content: { type: String, default: "" },
    type: { type: String, enum: ["text", "image", "document"], default: "text" },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
    replyToMessageId: { type: String },
    replyToSenderName: { type: String },
    replyToContentPreview: { type: String },
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date },
    pinnedByUserKey: { type: String },
    isSystem: { type: Boolean, default: false },
    systemAction: { type: String },
    clientRequestId: { type: String, index: true },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedByUserKey: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

chatMessageSchema.index({ chatGroupId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
