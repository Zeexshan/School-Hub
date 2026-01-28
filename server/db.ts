import mongoose from "mongoose";
import { log } from "./index";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set.");
  console.error("Please add your MongoDB Atlas connection string to the Secrets tab.");
  process.exit(1);
}

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    log("Connected to MongoDB Atlas successfully", "mongodb");
  } catch (error) {
    console.error("Failed to connect to MongoDB Atlas:", error);
    process.exit(1);
  }
}

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  log("MongoDB disconnected", "mongodb");
});

export default mongoose;
