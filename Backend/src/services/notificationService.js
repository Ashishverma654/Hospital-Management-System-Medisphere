import Notification from "../models/Notification.js";
import { normalizeSystemRole } from "../constants/roles.js";

const buildKey = (parts = []) => parts.filter(Boolean).join(":");

export const createNotification = async ({
  recipientType,
  recipientId,
  patientId,
  roleTarget,
  key,
  type = "system",
  title,
  message,
  priority = "normal",
  sourceType,
  sourceId,
  metadata = {},
}) => {
  if (!recipientType || !title || !message) return null;

  const normalizedRole = roleTarget ? normalizeSystemRole(roleTarget) : undefined;
  const resolvedKey = key || buildKey([recipientType, recipientId || normalizedRole, sourceType, sourceId, type, title]);
  const resolvedRecipientId = recipientId || undefined;

  const filter = resolvedRecipientId
    ? {
        $or: [
          {
            recipientType,
            recipientId: resolvedRecipientId,
            roleTarget: normalizedRole || undefined,
            key: resolvedKey,
          },
          {
            userId: resolvedRecipientId,
            key: resolvedKey,
          },
        ],
      }
    : {
        recipientType,
        recipientId: resolvedRecipientId,
        roleTarget: normalizedRole || undefined,
        key: resolvedKey,
      };

  return Notification.findOneAndUpdate(
    filter,
    {
      $set: {
        recipientType,
        recipientId: resolvedRecipientId,
        roleTarget: normalizedRole || undefined,
        userId: resolvedRecipientId,
        patientId: patientId || undefined,
        key: resolvedKey,
        type,
        title,
        message,
        priority,
        sourceType,
        sourceId,
        metadata,
      },
      $setOnInsert: {
        status: "unread",
        read: false,
      },
    },
    { upsert: true, returnDocument: "after" }
  );
};

export const notifyPatient = async ({
  userId,
  patientId,
  key,
  type,
  title,
  message,
  priority,
  sourceType,
  sourceId,
  metadata,
}) =>
  createNotification({
    recipientType: "patient",
    recipientId: userId,
    patientId,
    key,
    type,
    title,
    message,
    priority,
    sourceType,
    sourceId,
    metadata,
  });

export const notifyEmployee = async ({
  userId,
  key,
  type,
  title,
  message,
  priority,
  sourceType,
  sourceId,
  metadata,
}) =>
  createNotification({
    recipientType: "employee",
    recipientId: userId,
    key,
    type,
    title,
    message,
    priority,
    sourceType,
    sourceId,
    metadata,
  });

export const notifyRole = async ({
  role,
  key,
  type,
  title,
  message,
  priority,
  sourceType,
  sourceId,
  metadata,
}) =>
  createNotification({
    recipientType: "employee",
    roleTarget: role,
    key,
    type,
    title,
    message,
    priority,
    sourceType,
    sourceId,
    metadata,
  });

export const markNotificationRead = async (notification) => {
  notification.status = "read";
  notification.read = true;
  notification.readAt = new Date();
  await notification.save();
  return notification;
};

export const markAllReadForRecipient = async (filter) => {
  return Notification.updateMany(
    filter,
    { $set: { status: "read", read: true, readAt: new Date() } }
  );
};

export const countUnreadForRecipient = async (filter) =>
  Notification.countDocuments({ ...filter, status: "unread" });
