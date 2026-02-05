import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/gehu-clubs";

async function resetClubsAndMemberships() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Drop clubs and club memberships collections
    console.log("🗑️ Dropping clubs collection...");
    await mongoose.connection.db.collection("clubs").drop().catch(() => console.log("Clubs collection doesn't exist"));
    
    console.log("🗑️ Dropping clubmemberships collection...");
    await mongoose.connection.db.collection("clubmemberships").drop().catch(() => console.log("ClubMemberships collection doesn't exist"));
    
    console.log("🗑️ Dropping admins collection to force reseed...");
    await mongoose.connection.db.collection("admins").drop().catch(() => console.log("Admins collection doesn't exist"));
    
    console.log("✅ Collections dropped successfully");
    console.log("📝 Please restart the server to reseed the database with correct data");

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

resetClubsAndMemberships();
