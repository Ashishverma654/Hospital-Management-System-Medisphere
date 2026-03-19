import mongoose from "mongoose";
import Bed from "../models/Bed.js";
import NurseAssignment from "../models/NurseAssignment.js";
import Patient from "../models/Patient.js";
import Shift from "../models/Shift.js";
import User from "../models/User.js";
import Ward from "../models/Ward.js";
import { logAudit } from "../services/auditLogService.js";

const ACTIVE_ASSIGNMENT_STATUSES = ["scheduled", "active"];

const getPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildAssignmentFilter = ({ nurseUserId, wardId, shiftId, status, startDate, endDate }) => {
  const filter = {};
  if (nurseUserId) filter.nurseUserId = nurseUserId;
  if (wardId) filter.wardId = wardId;
  if (shiftId) filter.shiftId = shiftId;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.assignmentStart = {};
    if (startDate) filter.assignmentStart.$gte = new Date(startDate);
    if (endDate) filter.assignmentStart.$lte = new Date(endDate);
  }
  return filter;
};

const ensureNurseUser = async (nurseUserId) => {
  if (!mongoose.Types.ObjectId.isValid(nurseUserId)) return null;
  return User.findOne({ _id: nurseUserId, role: "nurse" });
};

const validatePatientAssignment = async ({ patientId, wardId }) => {
  if (!patientId) return { patient: null, bed: null };
  const patient = await Patient.findById(patientId).populate("userId", "name patientId");
  if (!patient) {
    return { error: "Patient not found." };
  }
  const bed = await Bed.findOne({
    patientProfileId: patient._id,
    wardId,
    status: "occupied",
  });
  if (!bed) {
    return { error: "Patient must be assigned to a bed in the selected ward." };
  }
  return { patient, bed };
};

const checkOverlap = async ({ nurseUserId, assignmentStart, assignmentEnd, excludeId }) => {
  const end = assignmentEnd ? new Date(assignmentEnd) : new Date("9999-12-31T23:59:59.999Z");
  const start = new Date(assignmentStart);

  const filter = {
    nurseUserId,
    status: { $in: ACTIVE_ASSIGNMENT_STATUSES },
    assignmentStart: { $lt: end },
    $or: [
      { assignmentEnd: { $exists: false } },
      { assignmentEnd: null },
      { assignmentEnd: { $gt: start } },
    ],
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const existing = await NurseAssignment.findOne(filter);
  return existing;
};

const resolveAssignmentStatus = ({ status, assignmentStart, assignmentEnd, fallbackStatus }) => {
  if (status !== undefined) {
    return status;
  }
  if (fallbackStatus && fallbackStatus !== "scheduled") {
    return fallbackStatus;
  }
  const now = new Date();
  const start = new Date(assignmentStart);
  const end = assignmentEnd ? new Date(assignmentEnd) : new Date("9999-12-31T23:59:59.999Z");
  if (now >= start && now <= end) {
    return "active";
  }
  return "scheduled";
};

const mapAssignment = (assignment) => ({
  id: assignment._id,
  nurse: assignment.nurseUserId
    ? {
        id: assignment.nurseUserId._id,
        name: assignment.nurseUserId.name,
        email: assignment.nurseUserId.email,
      }
    : null,
  ward: assignment.wardId
    ? {
        id: assignment.wardId._id,
        name: assignment.wardId.name,
        wardNumber: assignment.wardId.wardNumber,
      }
    : null,
  shift: assignment.shiftId
    ? {
        id: assignment.shiftId._id,
        name: assignment.shiftId.name,
        startTime: assignment.shiftId.startTime,
        endTime: assignment.shiftId.endTime,
        shiftType: assignment.shiftId.shiftType,
      }
    : null,
  patient: assignment.patientId
    ? {
        id: assignment.patientId._id,
        name: assignment.patientId.userId?.name,
        patientId: assignment.patientId.userId?.patientId,
      }
    : null,
  assignmentStart: assignment.assignmentStart,
  assignmentEnd: assignment.assignmentEnd,
  status: assignment.status,
  createdAt: assignment.createdAt,
  updatedAt: assignment.updatedAt,
});

export const listAssignments = async (req, res) => {
  try {
    const filter = buildAssignmentFilter(req.query);
    const { page, limit, skip } = getPagination(req.query);

    const [total, assignments] = await Promise.all([
      NurseAssignment.countDocuments(filter),
      NurseAssignment.find(filter)
        .populate("nurseUserId", "name email")
        .populate("wardId", "name wardNumber")
        .populate("shiftId", "name startTime endTime shiftType")
        .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
        .sort({ assignmentStart: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.json({
      success: true,
      message: "Assignments fetched successfully.",
      data: {
        items: assignments.map(mapAssignment),
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

export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await NurseAssignment.findById(req.params.id)
      .populate("nurseUserId", "name email")
      .populate("wardId", "name wardNumber")
      .populate("shiftId", "name startTime endTime shiftType")
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
        data: null,
      });
    }
    return res.json({
      success: true,
      message: "Assignment fetched successfully.",
      data: mapAssignment(assignment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const { nurseUserId, wardId, shiftId, patientId, assignmentStart, assignmentEnd, status } = req.body;
    if (!nurseUserId || !wardId || !shiftId || !assignmentStart) {
      return res.status(400).json({
        success: false,
        message: "Nurse, ward, shift, and assignment start are required.",
        data: null,
      });
    }

    if (assignmentEnd && new Date(assignmentEnd) <= new Date(assignmentStart)) {
      return res.status(400).json({
        success: false,
        message: "Assignment end must be after assignment start.",
        data: null,
      });
    }

    const [nurseUser, ward, shift] = await Promise.all([
      ensureNurseUser(nurseUserId),
      Ward.findById(wardId),
      Shift.findById(shiftId),
    ]);
    if (!nurseUser) {
      return res.status(404).json({
        success: false,
        message: "Nurse user not found.",
        data: null,
      });
    }
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Ward not found.",
        data: null,
      });
    }
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found.",
        data: null,
      });
    }

    const overlap = await checkOverlap({
      nurseUserId,
      assignmentStart,
      assignmentEnd,
    });
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Nurse already assigned in this time range",
        data: null,
      });
    }

    const patientCheck = await validatePatientAssignment({ patientId, wardId });
    if (patientCheck?.error) {
      return res.status(400).json({
        success: false,
        message: patientCheck.error,
        data: null,
      });
    }

    const assignment = await NurseAssignment.create({
      nurseUserId,
      wardId,
      shiftId,
      patientId: patientId || undefined,
      patientUserId: patientCheck?.patient?.userId?._id,
      assignmentStart,
      assignmentEnd: assignmentEnd || undefined,
      status: resolveAssignmentStatus({ status, assignmentStart, assignmentEnd }),
      createdBy: req.user.id,
      updatedBy: req.user.id,
      history: [
        {
          action: "created",
          performedBy: { id: req.user.id, name: req.user.name, role: req.user.role },
          details: "Assignment created",
        },
      ],
    });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "nurse_assignment_created",
      entityType: "NurseAssignment",
      entityId: assignment._id,
      details: { nurseUserId, wardId, shiftId, patientId },
    });

    const populated = await NurseAssignment.findById(assignment._id)
      .populate("nurseUserId", "name email")
      .populate("wardId", "name wardNumber")
      .populate("shiftId", "name startTime endTime shiftType")
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } });

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully.",
      data: mapAssignment(populated),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const assignment = await NurseAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
        data: null,
      });
    }

    const nurseUserId = req.body.nurseUserId ?? assignment.nurseUserId;
    const wardId = req.body.wardId ?? assignment.wardId;
    const shiftId = req.body.shiftId ?? assignment.shiftId;
    const assignmentStart = req.body.assignmentStart ?? assignment.assignmentStart;
    const assignmentEnd = req.body.assignmentEnd ?? assignment.assignmentEnd;
    const patientId = req.body.patientId ?? assignment.patientId;

    if (assignmentEnd && new Date(assignmentEnd) <= new Date(assignmentStart)) {
      return res.status(400).json({
        success: false,
        message: "Assignment end must be after assignment start.",
        data: null,
      });
    }

    const [nurseUser, ward, shift] = await Promise.all([
      ensureNurseUser(nurseUserId),
      Ward.findById(wardId),
      Shift.findById(shiftId),
    ]);
    if (!nurseUser) {
      return res.status(404).json({
        success: false,
        message: "Nurse user not found.",
        data: null,
      });
    }
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Ward not found.",
        data: null,
      });
    }
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found.",
        data: null,
      });
    }

    const overlap = await checkOverlap({
      nurseUserId,
      assignmentStart,
      assignmentEnd,
      excludeId: assignment._id,
    });
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Nurse already assigned in this time range",
        data: null,
      });
    }

    const patientCheck = await validatePatientAssignment({ patientId, wardId });
    if (patientCheck?.error) {
      return res.status(400).json({
        success: false,
        message: patientCheck.error,
        data: null,
      });
    }

    assignment.nurseUserId = nurseUserId;
    assignment.wardId = wardId;
    assignment.shiftId = shiftId;
    assignment.patientId = patientId || undefined;
    assignment.patientUserId = patientCheck?.patient?.userId?._id;
    assignment.assignmentStart = assignmentStart;
    assignment.assignmentEnd = assignmentEnd || undefined;
    assignment.status = resolveAssignmentStatus({
      status: req.body.status,
      assignmentStart,
      assignmentEnd,
      fallbackStatus: assignment.status,
    });
    assignment.updatedBy = req.user.id;
    assignment.history = [
      ...(assignment.history || []),
      {
        action: "updated",
        performedBy: { id: req.user.id, name: req.user.name, role: req.user.role },
        details: "Assignment updated",
      },
    ];
    await assignment.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "nurse_assignment_updated",
      entityType: "NurseAssignment",
      entityId: assignment._id,
      details: { nurseUserId, wardId, shiftId, patientId },
    });

    const populated = await NurseAssignment.findById(assignment._id)
      .populate("nurseUserId", "name email")
      .populate("wardId", "name wardNumber")
      .populate("shiftId", "name startTime endTime shiftType")
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } });

    return res.json({
      success: true,
      message: "Assignment updated successfully.",
      data: mapAssignment(populated),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await NurseAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
        data: null,
      });
    }

    await NurseAssignment.deleteOne({ _id: assignment._id });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "nurse_assignment_deleted",
      entityType: "NurseAssignment",
      entityId: assignment._id,
      details: { nurseUserId: assignment.nurseUserId, wardId: assignment.wardId },
    });

    return res.json({
      success: true,
      message: "Assignment deleted successfully.",
      data: { id: assignment._id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};
