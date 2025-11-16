import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("❌ MONGO_URI missing in .env file");
    }

    await mongoose.connect(uri);
    console.log("🚀 MongoDB Connected Successfully");
  } catch (error: any) {
    console.error("❌ MongoDB Error:", error.message);
    process.exit(1);
  }
};
