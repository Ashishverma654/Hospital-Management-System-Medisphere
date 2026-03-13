import AuditLog from "../models/AuditLog.js";
import { normalizeSystemRole } from "../constants/roles.js";

export const logAudit = async ({
  actor,
  action,
  entityType,
  entityId,
  details = {},
}) => {
  if (!actor?.id || !action || !entityType) {
    return null;
  }

  return AuditLog.create({
    actorId: actor.id,
    actorName: actor.name || "System",
    actorRole: normalizeSystemRole(actor.role),
    action,
    entityType,
    entityId,
    details,
  });
};
