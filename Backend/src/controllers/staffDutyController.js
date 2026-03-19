import mongoose from "mongoose";
import StaffDuty from "../models/StaffDuty.js";
import User from "../models/User.js";
import { normalizeSystemRole } from "../constants/roles.js";

const getDateKey = (date = new Date()) => date.toISOString().split("T")[0];

const resolveShiftType = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= 6 && hour < 14) return "morning";
  if (hour >= 14 && hour < 22) return "evening";
  return "night";
};

const resolveTargetUser = async (req, { allowOverride = true } = {}) => {
  const isAdmin = ["superadmin", "admin"].includes(normalizeSystemRole(req.user.role));
  const requestedUserId = allowOverride && isAdmin ? req.body.userId || req.query.userId : undefined;
  const targetUserId = requestedUserId || req.user.id;

  if (requestedUserId && !isAdmin) {
    const error = new Error("Only admin users can override staff duty records.");
    error.statusCode = 403;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    const error = new Error("Invalid userId.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(targetUserId).select("role name email");
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    user,
    targetUserId,
    isAdminOverride: Boolean(requestedUserId),
  };
};

export const startDuty = async (req, res) => {
  try {
    const { user, targetUserId, isAdminOverride } = await resolveTargetUser(req);
    const now = new Date();
    const dateKey = getDateKey(now);

    const existingOnDuty = await StaffDuty.findOne({
      userId: targetUserId,
      status: "onDuty",
    });
    if (existingOnDuty) {
      return res.status(400).json({ message: "Duty already started." });
    }

    const existingLeave = await StaffDuty.findOne({
      userId: targetUserId,
      date: dateKey,
      status: { $in: ["leave", "holiday"] },
    });
    if (existingLeave) {
      return res.status(400).json({ message: "Cannot start duty on leave or holiday." });
    }

    const duty = await StaffDuty.create({
      userId: targetUserId,
      role: normalizeSystemRole(user.role),
      date: dateKey,
      status: "onDuty",
      startTime: now,
      shiftType: req.body.shiftType || resolveShiftType(now),
      isManualOverride: isAdminOverride,
    });

    return res.status(201).json({
      message: "Duty started.",
      data: duty,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const endDuty = async (req, res) => {
  try {
    const { targetUserId, isAdminOverride } = await resolveTargetUser(req);
    const now = new Date();

    const duty = await StaffDuty.findOne({
      userId: targetUserId,
      status: "onDuty",
    }).sort({ startTime: -1 });

    if (!duty) {
      return res.status(400).json({ message: "No active duty session found." });
    }

    const totalHours = Math.max(0, (now.getTime() - new Date(duty.startTime).getTime()) / (1000 * 60 * 60));

    const normalizedRole = normalizeSystemRole(req.user.role);
    if ((normalizedRole === "nurse" || normalizedRole === "pharmacist") && totalHours < 5) {
      duty.status = "leave";
      duty.reason = "Worked less than 5 hours.";
    } else {
      duty.status = "offDuty";
    }
    duty.endTime = now;
    duty.totalHours = Number(totalHours.toFixed(2));
    if (isAdminOverride) duty.isManualOverride = true;
    await duty.save();

    return res.json({
      message: "Duty ended.",
      data: duty,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const markLeave = async (req, res) => {
  try {
    const { user, targetUserId, isAdminOverride } = await resolveTargetUser(req);
    const now = new Date();
    const dateKey = getDateKey(now);
    const status = req.body.type;

    const existingOnDuty = await StaffDuty.findOne({
      userId: targetUserId,
      status: "onDuty",
    });
    if (existingOnDuty) {
      return res.status(400).json({ message: "End the active duty before marking leave or holiday." });
    }

    const existing = await StaffDuty.findOne({
      userId: targetUserId,
      date: dateKey,
      status: { $in: ["leave", "holiday"] },
    });
    if (existing) {
      return res.status(400).json({ message: "Leave or holiday already marked for today." });
    }

    const duty = await StaffDuty.create({
      userId: targetUserId,
      role: normalizeSystemRole(user.role),
      date: dateKey,
      status,
      shiftType: req.body.shiftType || undefined,
      isManualOverride: isAdminOverride,
    });

    return res.status(201).json({
      message: status === "leave" ? "Leave marked." : "Holiday marked.",
      data: duty,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const { targetUserId } = await resolveTargetUser(req);
    const todayKey = getDateKey(new Date());

    const duties = await StaffDuty.find({ userId: targetUserId });

    const counts = duties.reduce(
      (acc, duty) => {
        acc.byStatus[duty.status] = (acc.byStatus[duty.status] || 0) + 1;
        if (["onDuty", "offDuty"].includes(duty.status)) acc.totalWorkingDays += 1;
        if (duty.status === "leave") acc.totalLeaves += 1;
        if (duty.status === "holiday") acc.totalHolidays += 1;
        if (duty.status === "offDuty") acc.totalHours += Number(duty.totalHours || 0);
        return acc;
      },
      {
        byStatus: {},
        totalWorkingDays: 0,
        totalLeaves: 0,
        totalHolidays: 0,
        totalHours: 0,
      }
    );

    return res.json({
      success: true,
      data: {
        ...counts,
        currentStatus: (() => {
          const active = duties.find((duty) => duty.status === "onDuty");
          if (active) return "onDuty";
          const todayRecords = duties.filter((duty) => duty.date === todayKey);
          const todayLeave = todayRecords.find((duty) => duty.status === "leave");
          if (todayLeave) return "leave";
          const todayHoliday = todayRecords.find((duty) => duty.status === "holiday");
          if (todayHoliday) return "holiday";
          const todayOff = todayRecords.find((duty) => duty.status === "offDuty");
          if (todayOff) return "offDuty";
          return "notStarted";
        })(),
        currentDuty: (() => {
          const active = duties.find((duty) => duty.status === "onDuty");
          if (active) return active;
          const todayRecords = duties.filter((duty) => duty.date === todayKey);
          const todayLeave = todayRecords.find((duty) => duty.status === "leave");
          if (todayLeave) return todayLeave;
          const todayHoliday = todayRecords.find((duty) => duty.status === "holiday");
          if (todayHoliday) return todayHoliday;
          const todayOff = todayRecords.find((duty) => duty.status === "offDuty");
          if (todayOff) return todayOff;
          return null;
        })(),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};
