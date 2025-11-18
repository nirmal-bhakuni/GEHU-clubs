import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  id: String,
  username: String,
  password: String,
  clubId: String
});

export const Admin = mongoose.model("Admin", adminSchema);
