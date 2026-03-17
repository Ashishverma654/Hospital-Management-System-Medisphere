import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../src/config/database.js";
import User from "../src/models/User.js";

const verify = async () => {
  try {
    await connectDB();
    
    const collections = await mongoose.connection.db.collections();
    const stats = [];
    
    for (const collection of collections) {
      const count = await collection.countDocuments();
      stats.push({ name: collection.collectionName, count });
    }
    
    console.log("Database Stats:");
    console.table(stats);
    
    const superAdmin = await User.findOne({ role: "superadmin" });
    if (superAdmin) {
      console.log(`Super Admin Found: ${superAdmin.email}`);
    } else {
      console.log("Super Admin NOT FOUND!");
    }
    
    const totalUsers = await User.countDocuments();
    console.log(`Total Users: ${totalUsers}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
};

verify();
