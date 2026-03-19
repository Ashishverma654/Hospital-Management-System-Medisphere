import mongoose from "mongoose";
import ShiftSchedule from "../models/ShiftSchedule.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { normalizeSystemRole } from "../constants/roles.js";
import { logAudit } from "../services/auditLogService.js";

const toDateKey = (date) => new Date(date).toISOString().split("T")[0];

const normalizeShiftWindow = ({ startTime, endTime }) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const error = new Error("Invalid startTime or endTime.");
    error.statusCode = 400;
    throw error;
  }
  if (end <= start) {
    const adjusted = new Date(end);
    adjusted.setDate(adjusted.getDate() + 1);
    return { start, end: adjusted };
  }
  return { start, end };
};

const ensureUser = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid userId.");
    error.statusCode = 400;
    throw error;
  }
  const user = await User.findById(userId).select("role name email");
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const hasOverlap = async ({ userId, start, end, excludeId }) => {
  const filter = {
    userId,
    startTime: { $lt: end },
    endTime: { $gt: start },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  const existing = await ShiftSchedule.findOne(filter).select("_id");
  return Boolean(existing);
};

export const getAllShiftSchedules = async (req, res) => {
  try {
    const { role, start, end, userId } = req.query;
    const filter = {};
    if (role) filter.role = normalizeSystemRole(role);
    if (userId) filter.userId = userId;
    if (start || end) {
      filter.startTime = {};
      if (start) filter.startTime.$gte = new Date(start);
      if (end) filter.startTime.$lte = new Date(end);
    }

    const items = await ShiftSchedule.find(filter)
      .populate("userId", "name email role employeeId")
      .sort({ startTime: 1 });

    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getMyShiftSchedules = async (req, res) => {
  try {
    const { start, end } = req.query;
    const filter = { userId: req.user.id };
    if (start || end) {
      filter.startTime = {};
      if (start) filter.startTime.$gte = new Date(start);
      if (end) filter.startTime.$lte = new Date(end);
    }

    const items = await ShiftSchedule.find(filter)
      .populate("userId", "name email role employeeId")
      .sort({ startTime: 1 });

    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const createShiftSchedule = async (req, res) => {
  try {
    const { userId, role, shiftType, startTime, endTime } = req.body;
    const user = await ensureUser(userId);
    const { start, end } = normalizeShiftWindow({ startTime, endTime });
    const dateKey = toDateKey(start);

    const overlap = await hasOverlap({ userId, start, end });
    if (overlap) {
      return res.status(400).json({ message: "Shift overlaps with an existing schedule." });
    }

    const schedule = await ShiftSchedule.create({
      userId,
      role: normalizeSystemRole(role || user.role),
      shiftType,
      startTime: start,
      endTime: end,
      date: dateKey,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "shift_schedule_created",
      entityType: "ShiftSchedule",
      entityId: schedule._id,
      details: { userId, shiftType, startTime: start, endTime: end },
    });

    return res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const updateShiftSchedule = async (req, res) => {
  try {
    const schedule = await ShiftSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Shift schedule not found." });
    }

    const updated = {
      userId: schedule.userId,
      role: schedule.role,
      shiftType: schedule.shiftType,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    };

    if (req.body.userId) {
      const user = await ensureUser(req.body.userId);
      updated.userId = user._id;
      updated.role = normalizeSystemRole(req.body.role || user.role);
    } else if (req.body.role) {
      updated.role = normalizeSystemRole(req.body.role);
    }

    if (req.body.shiftType) updated.shiftType = req.body.shiftType;

    const timePayload = {
      startTime: req.body.startTime ?? updated.startTime,
      endTime: req.body.endTime ?? updated.endTime,
    };
    const { start, end } = normalizeShiftWindow(timePayload);
    updated.startTime = start;
    updated.endTime = end;

    const overlap = await hasOverlap({ userId: updated.userId, start, end, excludeId: schedule._id });
    if (overlap) {
      return res.status(400).json({ message: "Shift overlaps with an existing schedule." });
    }

    schedule.userId = updated.userId;
    schedule.role = updated.role;
    schedule.shiftType = updated.shiftType;
    schedule.startTime = updated.startTime;
    schedule.endTime = updated.endTime;
    schedule.date = toDateKey(updated.startTime);
    schedule.updatedBy = req.user.id;

    await schedule.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "shift_schedule_updated",
      entityType: "ShiftSchedule",
      entityId: schedule._id,
      details: {
        userId: schedule.userId,
        shiftType: schedule.shiftType,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
    });

    return res.json({ success: true, data: schedule });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const deleteShiftSchedule = async (req, res) => {
  try {
    const schedule = await ShiftSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Shift schedule not found." });
    }

    await ShiftSchedule.deleteOne({ _id: schedule._id });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "shift_schedule_deleted",
      entityType: "ShiftSchedule",
      entityId: schedule._id,
      details: { userId: schedule.userId, shiftType: schedule.shiftType },
    });
    return res.json({ success: true, data: { id: schedule._id } });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getShiftScheduleHistory = async (req, res) => {
  try {
    const { date, role, action, limit = 50 } = req.query;
    const filter = { entityType: "ShiftSchedule" };
    if (action) filter.action = action;
    if (role) filter.actorRole = normalizeSystemRole(role);
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
