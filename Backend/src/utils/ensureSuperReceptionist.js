import bcrypt from "bcryptjs";
import User from "../models/User.js";
import logger from "./logger.js";

export async function ensureSuperReceptionist() {
  const email = process.env.SUPER_RECEPTIONIST_EMAIL;
  const password = process.env.SUPER_RECEPTIONIST_PASSWORD;
  const name = process.env.SUPER_RECEPTIONIST_NAME || "Super Receptionist";

  if (!email || !password) {
    logger.warn("SUPER_RECEPTIONIST_EMAIL/SUPER_RECEPTIONIST_PASSWORD not set; skipping super receptionist seed");
    return null;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "superreceptionist") {
      existing.role = "superreceptionist";
      await existing.save();
      logger.warn("Existing SUPER_RECEPTIONIST_EMAIL user role updated to superreceptionist");
    }
    return existing;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: "superreceptionist",
  });

  logger.info("Super receptionist user seeded", { email });
  return user;
}

