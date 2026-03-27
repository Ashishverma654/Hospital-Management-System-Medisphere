import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import LabOrder from "../models/LabOrder.js";
import Notification from "../models/Notification.js";
import PharmacyOrder from "../models/PharmacyOrder.js";
import Doctor from "../models/Doctor.js";
import NotificationPreference from "../models/NotificationPreference.js";
import { ensurePatientProfileForUser } from "../utils/patientContext.js";
import { normalizeLabOrderStatus } from "../utils/labWorkflow.js";
import { normalizePharmacyStatus, PHARMACY_STATUS } from "../utils/pharmacyWorkflow.js";
import { EMPLOYEE_ROLES, normalizeSystemRole } from "../constants/roles.js";
import {
  countUnreadForRecipient,
  createNotification,
  markAllReadForRecipient,
  markNotificationRead as markNotificationReadRecord,
  notifyPatient,
} from "../services/notificationService.js";
import { logAudit } from "../services/auditLogService.js";

const buildKey = (parts = []) => parts.filter(Boolean).join(":");

const hydrateNotifications = async ({ userId, patientId }) => {
  const now = new Date();
  const todayKey = now.toISOString().split("T")[0];

  const [appointments, labOrders, pharmacyOrders, invoices] = await Promise.all([
    Appointment.find({ patientId: userId }).sort({ date: 1 }).limit(10),
    LabOrder.find({ patientId }).sort({ createdAt: -1 }).limit(10),
    PharmacyOrder.find({ patientId }).sort({ createdAt: -1 }).limit(10),
    Invoice.find({ patientId, paymentStatus: "pending" }).sort({ createdAt: -1 }).limit(10),
  ]);

  const tasks = [];

  appointments
    .filter((appointment) => appointment.date >= todayKey && appointment.status !== "cancelled")
    .forEach((appointment) => {
    const key = buildKey(["appointment", appointment._id, "upcoming", todayKey]);
    const title = "Upcoming appointment";
    const message = `${appointment.date} at ${appointment.slot}`;
    tasks.push(
      notifyPatient({
        userId,
        patientId,
        key,
        type: "appointment",
        title,
        message,
        sourceType: "appointment",
        sourceId: appointment._id,
        metadata: { date: appointment.date, slot: appointment.slot, status: appointment.status },
      })
    );
    });

  labOrders.forEach((order) => {
    const status = normalizeLabOrderStatus(order.status);
    if (status === "reportReady" && order.paymentStatus !== "paid") {
      const key = buildKey(["lab", order._id, "paymentPending"]);
      tasks.push(
        notifyPatient({
          userId,
          patientId,
          key,
          type: "lab",
          title: "Lab report ready (payment pending)",
          message: `${order.orderNumber || "Lab order"} is ready after payment.`,
          sourceType: "labOrder",
          sourceId: order._id,
          metadata: { status, paymentStatus: order.paymentStatus },
        })
      );
    }
    if (status === "reportReleasedToPortal" || order.releasedToPortal) {
      const key = buildKey(["lab", order._id, "reportReleased"]);
      tasks.push(
        notifyPatient({
          userId,
          patientId,
          key,
          type: "lab",
          title: "Lab report released",
          message: `${order.orderNumber || "Lab order"} report is available in your portal.`,
          sourceType: "labOrder",
          sourceId: order._id,
          metadata: { status, paymentStatus: order.paymentStatus },
        })
      );
    }
  });

  pharmacyOrders.forEach((order) => {
    const status = normalizePharmacyStatus(order.status);
    if (status === PHARMACY_STATUS.READY_FOR_PICKUP) {
      const key = buildKey(["pharmacy", order._id, "ready"]);
      tasks.push(
        notifyPatient({
          userId,
          patientId,
          key,
          type: "pharmacy",
          title: "Medicine ready for pickup",
          message: "Your medicine order is ready for pickup.",
          sourceType: "pharmacyOrder",
          sourceId: order._id,
          metadata: { status, paymentStatus: order.paymentStatus },
        })
      );
    }
    if (order.paymentStatus === "pending" && [PHARMACY_STATUS.ORDER_PLACED, PHARMACY_STATUS.ORDER_ACCEPTED, PHARMACY_STATUS.PREPARING].includes(status)) {
      const key = buildKey(["pharmacy", order._id, "paymentPending"]);
      tasks.push(
        notifyPatient({
          userId,
          patientId,
          key,
          type: "billing",
          title: "Payment pending for medicines",
          message: "Payment is pending for your pharmacy order.",
          sourceType: "pharmacyOrder",
          sourceId: order._id,
          metadata: { status, paymentStatus: order.paymentStatus },
        })
      );
    }
  });

  invoices.forEach((invoice) => {
    const key = buildKey(["invoice", invoice._id, invoice.paymentStatus]);
    tasks.push(
      notifyPatient({
        userId,
        patientId,
        key,
        type: "billing",
        title: "Payment pending",
        message: `${invoice.billType} bill awaiting payment.`,
        sourceType: "invoice",
        sourceId: invoice._id,
        metadata: { billType: invoice.billType, totalAmount: invoice.totalAmount },
      })
    );
  });

  await Promise.all(tasks);
};

export const getMyNotifications = async (req, res) => {
  try {
    const { patient, user } = await ensurePatientProfileForUser(req.user.id);
    await hydrateNotifications({ userId: user._id, patientId: patient._id });

    const notifications = await Notification.find({
      $or: [
        { recipientType: "patient", recipientId: user._id },
        { userId: user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(
      notifications.map((notification) => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        status: notification.status,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        sourceType: notification.sourceType,
        sourceId: notification.sourceId,
        priority: notification.priority,
        metadata: notification.metadata || {},
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    if (
      String(notification.recipientId || notification.userId || "") !== String(req.user.id)
      && notification.recipientType !== "patient"
    ) {
      return res.status(403).json({ message: "Access forbidden." });
    }

    await markNotificationReadRecord(notification);

    return res.json({ message: "Notification marked as read." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await markAllReadForRecipient({
      $or: [
        { recipientType: "patient", recipientId: req.user.id },
        { userId: req.user.id },
      ],
    });

    return res.json({ message: "All notifications marked as read." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      $or: [
        { recipientType: "patient", recipientId: req.user.id, status: "unread" },
        { userId: req.user.id, status: "unread" },
      ],
    });
    return res.json({ unreadCount: count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const employeeNotificationFilter = (user) => ({
  $or: [
    { recipientType: "employee", recipientId: user._id },
    { recipientType: "employee", roleTarget: normalizeSystemRole(user.role) },
    { userId: user._id },
  ],
});

const DEFAULT_ALLOWED_TYPES = ["system", "general", "attendance"];
const ROLE_ALLOWED_TYPES = {
  receptionist: ["appointment", "attendance", ...DEFAULT_ALLOWED_TYPES],
  doctor: ["appointment", "admission", "lab", "pharmacy", "billing", "attendance", ...DEFAULT_ALLOWED_TYPES],
  nurse: ["admission", "attendance", ...DEFAULT_ALLOWED_TYPES],
  labTechnician: ["lab", "attendance", ...DEFAULT_ALLOWED_TYPES],
  pharmacist: ["stock", "pharmacy", "attendance", ...DEFAULT_ALLOWED_TYPES],
  admin: ["billing", "admission", "lab", "stock", "attendance", ...DEFAULT_ALLOWED_TYPES],
  superadmin: ["billing", "admission", "lab", "stock", "attendance", ...DEFAULT_ALLOWED_TYPES],
  subadmin: ["billing", "admission", "lab", "stock", "attendance", ...DEFAULT_ALLOWED_TYPES],
};

const getAllowedTypesForRole = (role) => {
  const normalized = normalizeSystemRole(role);
  return new Set(ROLE_ALLOWED_TYPES[normalized] || DEFAULT_ALLOWED_TYPES);
};

const filterNotificationsByRole = (notifications, role) => {
  const allowedTypes = getAllowedTypesForRole(role);
  return notifications.filter((notification) => allowedTypes.has(notification.type || "general"));
};

const applyPreferenceFilter = (notifications, preferences) => {
  if (!preferences) return notifications;
  if (preferences.muteAll) return [];
  const mutedTypes = new Set(preferences.mutedTypes || []);
  const mutedPriorities = new Set(preferences.mutedPriorities || []);
  return notifications.filter((notification) => {
    if (mutedTypes.has(notification.type)) return false;
    if (mutedPriorities.has(notification.priority)) return false;
    return true;
  });
};

const getPreferencesForUser = async (userId) =>
  NotificationPreference.findOne({ userId }).lean();

export const getMyEmployeeNotifications = async (req, res) => {
  try {
    if (normalizeSystemRole(req.user.role) === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (doctor) {
        const today = new Date().toISOString().split("T")[0];
        const arrivals = await Appointment.find({
          doctorId: doctor._id,
          date: { $gte: today },
          status: { $in: ["arrived", "waiting", "checked-in"] },
        })
          .populate("patientId", "name patientId")
          .select("patientId date slot status");

        await Promise.all(
          arrivals.map((appointment) =>
            createNotification({
              recipientType: "employee",
              recipientId: req.user.id,
              roleTarget: normalizeSystemRole(req.user.role),
              key: buildKey(["appointment", appointment._id, "arrived"]),
              type: "appointment",
              title: "Patient arrived",
              message: `${appointment.patientId?.name || "Patient"} checked in for ${appointment.date} at ${appointment.slot}.`,
              sourceType: "appointment",
              sourceId: appointment._id,
              metadata: { status: appointment.status },
            })
          )
        );
      }
    }

    const notifications = await Notification.find(employeeNotificationFilter(req.user))
      .sort({ createdAt: -1 })
      .limit(50);

    const preferences = await getPreferencesForUser(req.user.id);
    const filteredNotifications = applyPreferenceFilter(
      filterNotificationsByRole(notifications, req.user.role),
      preferences
    );

    res.json(
      filteredNotifications.map((notification) => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        status: notification.status,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        sourceType: notification.sourceType,
        sourceId: notification.sourceId,
        priority: notification.priority,
        metadata: notification.metadata || {},
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markEmployeeNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    if (
      notification.recipientType !== "employee"
      || (
        String(notification.recipientId || "") !== String(req.user.id)
        && normalizeSystemRole(notification.roleTarget || "") !== normalizeSystemRole(req.user.role)
      )
    ) {
      return res.status(403).json({ message: "Access forbidden." });
    }

    await markNotificationReadRecord(notification);
    return res.json({ message: "Notification marked as read." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markAllEmployeeNotificationsRead = async (req, res) => {
  try {
    await markAllReadForRecipient(employeeNotificationFilter(req.user));
    return res.json({ message: "All notifications marked as read." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getEmployeeUnreadCount = async (req, res) => {
  try {
    const baseFilter = employeeNotificationFilter(req.user);
    const allowedTypes = Array.from(getAllowedTypesForRole(req.user.role));
    const preferences = await getPreferencesForUser(req.user.id);
    const mutedTypes = new Set(preferences?.mutedTypes || []);
    const mutedPriorities = new Set(preferences?.mutedPriorities || []);
    if (preferences?.muteAll) {
      return res.json({ unreadCount: 0 });
    }
    const typeFilter = allowedTypes.filter((type) => !mutedTypes.has(type));
    const priorityFilter = mutedPriorities.size ? { $nin: Array.from(mutedPriorities) } : undefined;
    let count = await Notification.countDocuments({
      ...baseFilter,
      status: "unread",
      type: { $in: typeFilter },
      ...(priorityFilter ? { priority: priorityFilter } : {}),
    });
    if (count === 0 && normalizeSystemRole(req.user.role) === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (doctor) {
        const today = new Date().toISOString().split("T")[0];
        const arrivals = await Appointment.find({
          doctorId: doctor._id,
          date: { $gte: today },
          status: { $in: ["arrived", "waiting", "checked-in"] },
        }).select("_id");

        await Promise.all(
          arrivals.map((appointment) =>
            createNotification({
              recipientType: "employee",
              recipientId: req.user.id,
              roleTarget: normalizeSystemRole(req.user.role),
              key: buildKey(["appointment", appointment._id, "arrived"]),
              type: "appointment",
              title: "Patient arrived",
              message: "A patient has checked in for the appointment.",
              sourceType: "appointment",
              sourceId: appointment._id,
            })
          )
        );

        count = await Notification.countDocuments({
          ...employeeNotificationFilter(req.user),
          status: "unread",
        });
      }
    }
    return res.json({ unreadCount: count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getEmployeeNotificationPreferences = async (req, res) => {
  try {
    const preferences = await NotificationPreference.findOne({ userId: req.user.id });
    if (!preferences) {
      return res.json({
        mutedTypes: [],
        mutedPriorities: [],
        muteAll: false,
        allowUrgentSound: true,
      });
    }
    return res.json({
      mutedTypes: preferences.mutedTypes || [],
      mutedPriorities: preferences.mutedPriorities || [],
      muteAll: Boolean(preferences.muteAll),
      allowUrgentSound: preferences.allowUrgentSound !== false,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateEmployeeNotificationPreferences = async (req, res) => {
  try {
    const { mutedTypes = [], mutedPriorities = [], muteAll = false, allowUrgentSound = true } = req.body || {};
    const preferences = await NotificationPreference.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          mutedTypes: Array.isArray(mutedTypes) ? mutedTypes : [],
          mutedPriorities: Array.isArray(mutedPriorities) ? mutedPriorities : [],
          muteAll: Boolean(muteAll),
          allowUrgentSound: allowUrgentSound !== false,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: normalizeSystemRole(req.user.role) },
      action: "notification_preferences_updated",
      entityType: "NotificationPreference",
      entityId: preferences._id,
      details: {
        mutedTypes: preferences.mutedTypes || [],
        mutedPriorities: preferences.mutedPriorities || [],
        muteAll: Boolean(preferences.muteAll),
        allowUrgentSound: preferences.allowUrgentSound !== false,
      },
    });

    return res.json({
      mutedTypes: preferences.mutedTypes || [],
      mutedPriorities: preferences.mutedPriorities || [],
      muteAll: Boolean(preferences.muteAll),
      allowUrgentSound: preferences.allowUrgentSound !== false,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
