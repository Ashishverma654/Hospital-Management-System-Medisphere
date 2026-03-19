import Shift from "../models/Shift.js";
import { logAudit } from "../services/auditLogService.js";

const generateShiftCode = async (name) => {
  const raw = (name || "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
  const abbr = raw.slice(0, 3) || "GEN";
  let base = `SHIFT-${abbr}`;
  let code = base;
  let counter = 1;
  while (await Shift.exists({ code })) {
    counter += 1;
    code = `${base}-${counter}`;
  }
  return code;
};

const buildShiftFilter = ({ search, isActive }) => {
  const filter = {};
  if (typeof isActive === "string" && isActive !== "") {
    filter.isActive = isActive === "true";
  }
  if (search?.trim()) {
    filter.name = { $regex: search.trim(), $options: "i" };
  }
  return filter;
};

const getPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const listShifts = async (req, res) => {
  try {
    const filter = buildShiftFilter(req.query);
    const { page, limit, skip } = getPagination(req.query);

    const [total, shifts] = await Promise.all([
      Shift.countDocuments(filter),
      Shift.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.json({
      success: true,
      message: "Shifts fetched successfully.",
      data: {
        items: shifts,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

export const getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found.",
        data: null,
      });
    }
    return res.json({
      success: true,
      message: "Shift fetched successfully.",
      data: shift,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

export const createShift = async (req, res) => {
  try {
    const { name, shiftType, startTime, endTime, isActive, code, description } = req.body;
    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Name, start time, and end time are required.",
        data: null,
      });
    }

    const resolvedCode = code?.trim() ? code.trim() : await generateShiftCode(name);

    const shift = await Shift.create({
      name: name.trim(),
      shiftType,
      startTime,
      endTime,
      code: resolvedCode,
      description: description?.trim() || "",
      isActive: isActive ?? true,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "shift_created",
      entityType: "Shift",
      entityId: shift._id,
      details: { name: shift.name, startTime: shift.startTime, endTime: shift.endTime },
    });

    return res.status(201).json({
      success: true,
      message: "Shift created successfully.",
      data: shift,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

export const updateShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found.",
        data: null,
      });
    }

    if (req.body.name !== undefined) shift.name = req.body.name.trim();
    if (req.body.shiftType !== undefined) shift.shiftType = req.body.shiftType;
    if (req.body.startTime !== undefined) shift.startTime = req.body.startTime;
    if (req.body.endTime !== undefined) shift.endTime = req.body.endTime;
    if (req.body.code !== undefined) shift.code = req.body.code?.trim() || shift.code;
    if (req.body.description !== undefined) shift.description = req.body.description?.trim() || "";
    if (req.body.isActive !== undefined) shift.isActive = req.body.isActive;
    shift.updatedBy = req.user.id;
    await shift.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "shift_updated",
      entityType: "Shift",
      entityId: shift._id,
      details: { name: shift.name, startTime: shift.startTime, endTime: shift.endTime },
    });

    return res.json({
      success: true,
      message: "Shift updated successfully.",
      data: shift,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

export const deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found.",
        data: null,
      });
    }

    await Shift.deleteOne({ _id: shift._id });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "shift_deleted",
      entityType: "Shift",
      entityId: shift._id,
      details: { name: shift.name },
    });

    return res.json({
      success: true,
      message: "Shift deleted successfully.",
      data: { id: shift._id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};
