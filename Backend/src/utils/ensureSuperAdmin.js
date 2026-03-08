import bcrypt from "bcryptjs";
import User from "../models/User.js";
import logger from "./logger.js";

export async function ensureSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    logger.warn("SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD not set; skipping super admin seed");
    return null;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      logger.warn("Existing SUPER_ADMIN_EMAIL user role updated to admin");
    }
    return existing;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: "admin",
  });

  logger.info("Super admin user seeded", { email });
  return user;
}

