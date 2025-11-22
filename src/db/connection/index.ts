// src/config/database.ts 
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const DB_NAME = process.env.DB_NAME;
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("❌ Missing MONGODB_URI");
  if (!DB_NAME) throw new Error("❌ Missing DB_NAME");
  try {
    await mongoose.connect(uri, {
      dbName: DB_NAME,
      autoIndex: true,
    });

    console.log(`📦 MongoDB connected → DB: ${DB_NAME}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    throw err;
  }
};

// Gracefully close DB connection
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed.");
  } catch (err) {
    console.error("❌ Error closing MongoDB connection:", err);
  }
};
