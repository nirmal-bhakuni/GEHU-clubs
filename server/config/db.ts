import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      console.warn("⚠️ MONGO_URI missing in .env file — skipping MongoDB connection");
      return false;
    }

    await mongoose.connect(uri);
    console.log("🚀 MongoDB Connected Successfully");
    return true;

  } catch (error: any) {
    console.error("❌ MongoDB Error:", error.message);
    return false;
  }
};
