import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import LabOrder from "../models/LabOrder.js";
import Notification from "../models/Notification.js";
import PharmacyOrder from "../models/PharmacyOrder.js";
import { ensurePatientProfileForUser } from "../utils/patientContext.js";
import { normalizeLabOrderStatus } from "../utils/labWorkflow.js";
import { normalizePharmacyStatus, PHARMACY_STATUS } from "../utils/pharmacyWorkflow.js";
import { EMPLOYEE_ROLES, normalizeSystemRole } from "../constants/roles.js";
import {
  countUnreadForRecipient,
  markAllReadForRecipient,
  markNotificationRead as markNotificationReadRecord,
  notifyPatient,
} from "../services/notificationService.js";

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
      const key = buildKey(["lab", order._id, "released"]);
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

export const getMyEmployeeNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find(employeeNotificationFilter(req.user))
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
    const count = await Notification.countDocuments({
      ...employeeNotificationFilter(req.user),
      status: "unread",
    });
    return res.json({ unreadCount: count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
