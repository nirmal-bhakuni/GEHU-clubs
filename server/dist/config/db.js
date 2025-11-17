"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.warn("⚠️  MONGO_URI missing in .env file — skipping MongoDB connection (using in-memory storage)");
            return;
        }
        await mongoose_1.default.connect(uri);
        console.log("🚀 MongoDB Connected Successfully");
    }
    catch (error) {
        console.error("❌ MongoDB Error:", error.message);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
