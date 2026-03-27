import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

if (!MONGO_URI) {
  console.error("MONGO_URI not found in .env");
  process.exit(1);
}

const COLLECTIONS_TO_KEEP_DATA = [
  // Add any collections here if you want to keep their data
  // e.g., "hospitalsettings", "hospitallocations"
];

async function resetDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    const db = mongoose.connection.db;
    const collections = await db.collections();

    console.log(`Found ${collections.length} collections.`);

    for (const collection of collections) {
      const collectionName = collection.collectionName;

      if (COLLECTIONS_TO_KEEP_DATA.includes(collectionName)) {
        console.log(`Skipping collection (kept by config): ${collectionName}`);
        continue;
      }

      if (collectionName === "users") {
        console.log(`Cleaning 'users' collection (keeping superadmin: ${SUPER_ADMIN_EMAIL})...`);
        const result = await collection.deleteMany({ email: { $ne: SUPER_ADMIN_EMAIL } });
        console.log(`Deleted ${result.deletedCount} users.`);
      } else {
        console.log(`Clearing collection: ${collectionName}...`);
        const result = await collection.deleteMany({});
        console.log(`Deleted ${result.deletedCount} documents from ${collectionName}.`);
      }
    }

    console.log("\nDatabase reset complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

// Confirmation check (optional if running via CLI)
const args = process.argv.slice(2);
if (args.includes("--confirm")) {
  resetDatabase();
} else {
  console.log("WARNING: This script will delete ALL data from the database except the superadmin.");
  console.log("Run with --confirm to execute.");
  console.log("Example: node scripts/reset_db.js --confirm");
  process.exit(0);
}
