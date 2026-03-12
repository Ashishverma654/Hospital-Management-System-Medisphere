import User from "../models/User.js";
import logger from "./logger.js";
import { LEGACY_ROLE_MIGRATIONS } from "../constants/roles.js";

export async function migrateLegacyRoles() {
  const legacyRoles = Object.keys(LEGACY_ROLE_MIGRATIONS);

  for (const legacyRole of legacyRoles) {
    const nextRole = LEGACY_ROLE_MIGRATIONS[legacyRole];
    const result = await User.updateMany(
      { role: legacyRole },
      { $set: { role: nextRole } },
    );

    if (result.modifiedCount > 0) {
      logger.warn(`Migrated ${result.modifiedCount} ${legacyRole} user(s) to ${nextRole}`);
    }
  }
}
