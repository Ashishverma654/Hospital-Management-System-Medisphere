import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../src/config/database.js";
import { ensureSuperAdmin } from "../src/utils/ensureSuperAdmin.js";

const cleanup = async () => {
  try {
    console.log("Starting database cleanup...");
    await connectDB();
    
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      const collectionName = collection.collectionName;
      console.log(`Clearing collection: ${collectionName}`);
      await collection.deleteMany({});
    }
    
    console.log("All collections cleared. Re-establishing Super Admin...");
    await ensureSuperAdmin();
    
    console.log("Database cleanup complete. Super Admin is preserved.");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
};

cleanup();
