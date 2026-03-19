import mongoose from "mongoose";
import Admission from "../models/Admission.js";
import NurseAssignment from "../models/NurseAssignment.js";
import Doctor from "../models/Doctor.js";
import Ward from "../models/Ward.js";
import Bed from "../models/Bed.js";
import { resolvePatientContext } from "../utils/patientContext.js";
import { logAudit } from "../services/auditLogService.js";
import { notifyEmployee } from "../services/notificationService.js";

const getPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildAdmissionFilter = (query = {}, user) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.wardId) filter.wardId = query.wardId;
  if (query.departmentId) filter.departmentId = query.departmentId;
  if (query.patientId) filter.patientId = query.patientId;
  if (query.doctorId) filter.doctorId = query.doctorId;
  if (query.startDate || query.endDate) {
    filter.admissionDate = {};
    if (query.startDate) filter.admissionDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.admissionDate.$lte = new Date(query.endDate);
  }

  if (user?.role === "doctor") {
    filter.doctorId = user.doctorId || query.doctorId;
  }

  return filter;
};

const mapAdmission = (admission) => ({
  id: admission._id,
  status: admission.status,
  admissionDate: admission.admissionDate,
  dischargeDate: admission.dischargeDate,
  reason: admission.reason,
  notes: admission.notes,
  patient: admission.patientProfileId
    ? {
        id: admission.patientProfileId._id,
        name: admission.patientProfileId.userId?.name,
        patientId: admission.patientProfileId.userId?.patientId,
      }
    : null,
  bed: admission.bedId
    ? {
        id: admission.bedId._id,
        bedNumber: admission.bedId.bedNumber,
        status: admission.bedId.status,
      }
    : null,
  ward: admission.wardId
    ? {
        id: admission.wardId._id,
        name: admission.wardId.name,
        wardNumber: admission.wardId.wardNumber,
      }
    : null,
  department: admission.departmentId
    ? {
        id: admission.departmentId._id,
        name: admission.departmentId.name,
      }
    : null,
  doctor: admission.doctorId
    ? {
        id: admission.doctorId._id,
        name: admission.doctorId.userId?.name,
      }
    : null,
});

const notifyWardNurses = async ({ wardId, title, message, sourceId, metadata }) => {
  if (!wardId) return;
  const now = new Date();
  const assignments = await NurseAssignment.find({
    wardId,
    status: { $in: ["scheduled", "active"] },
    $or: [{ assignmentEnd: { $exists: false } }, { assignmentEnd: null }, { assignmentEnd: { $gte: now } }],
  }).select("nurseUserId");
  const nurseIds = [...new Set(assignments.map((a) => String(a.nurseUserId)).filter(Boolean))];
  await Promise.all(
    nurseIds.map((userId) =>
      notifyEmployee({
        userId,
        key: `ward:${wardId}:admission:${sourceId}`,
        type: "admission",
        title,
        message,
        sourceType: "Admission",
        sourceId,
        metadata,
      })
    )
  );
};

const findAvailableBedForDepartment = async (departmentId, session) => {
  const wardIds = await Ward.find({ departmentId, isActive: true }).select("_id").session(session || null);
  if (!wardIds.length) return null;
  return Bed.findOne({ wardId: { $in: wardIds.map((w) => w._id) }, status: "available", isActive: true })
    .populate("wardId")
    .sort({ bedNumber: 1, createdAt: 1 })
    .session(session || null);
};

export const createAdmission = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { patientId, departmentId, doctorId, reason, notes } = req.body;
    if (!patientId || !departmentId || !doctorId) {
      return res.status(400).json({
        success: false,
        message: "Patient, department, and doctor are required.",
        data: null,
      });
    }

    let admission = null;
    let populatedAdmission = null;
    let bed = null;
    let doctorUserId = null;

    await session.withTransaction(async () => {
      const { patient, user } = await resolvePatientContext(patientId);
      const existingAdmission = await Admission.findOne({
        patientProfileId: patient._id,
        status: { $in: ["Admitted", "Transferred"] },
      }).session(session);
      if (existingAdmission) {
        throw { status: 400, message: "This patient already has an active admission." };
      }

      const doctor = await Doctor.findById(doctorId).session(session);
      if (!doctor) {
        throw { status: 404, message: "Doctor not found." };
      }
      doctorUserId = doctor.userId;

      if (doctor.departmentId && String(doctor.departmentId) !== String(departmentId)) {
        throw { status: 400, message: "Selected doctor does not belong to the department." };
      }

      bed = await findAvailableBedForDepartment(departmentId, session);
      if (!bed) {
        throw { status: 400, message: "No available beds in the selected department." };
      }

      bed.status = "occupied";
      bed.patientId = user._id;
      bed.patientProfileId = patient._id;
      bed.admittedAt = new Date();
      bed.dischargedAt = null;
      bed.admissionHistory.push({
        patientId: user._id,
        patientProfileId: patient._id,
        doctorId: doctor._id,
        admittedAt: bed.admittedAt,
        admittedBy: req.user.id,
        status: "admitted",
      });

      const [createdAdmission] = await Admission.create(
        [
          {
            patientId: user._id,
            patientProfileId: patient._id,
            wardId: bed.wardId?._id,
            bedId: bed._id,
            departmentId,
            doctorId: doctor._id,
            admittedBy: req.user.id,
            admissionDate: bed.admittedAt,
            status: "Admitted",
            reason,
            notes,
          },
        ],
        { session }
      );

      admission = createdAdmission;
      bed.admissionId = admission._id;
      await bed.save({ session });

      if (bed.wardId?._id) {
        await Ward.findByIdAndUpdate(bed.wardId._id, { $inc: { occupiedBeds: 1 } }, { session });
      }

      populatedAdmission = await Admission.findById(admission._id)
        .populate({ path: "patientProfileId", populate: { path: "userId", select: "name patientId" } })
        .populate("bedId", "bedNumber status")
        .populate("wardId", "name wardNumber")
        .populate("departmentId", "name")
        .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
        .session(session);
    });

    await logAdmissionAudit({
      req,
      admission,
      action: "admission_created",
      details: { patientId: admission.patientId, bedId: admission.bedId },
    });

    if (doctorUserId) {
      await notifyEmployee({
        userId: doctorUserId,
        key: `admission:${admission._id}:doctor`,
        type: "admission",
        title: "New admission assigned",
        message: `Patient admitted to ${bed.wardId?.name || "ward"} (Bed ${bed.bedNumber}).`,
        sourceType: "Admission",
        sourceId: admission._id,
      });
    }

    await notifyWardNurses({
      wardId: bed.wardId?._id,
      title: "New admission in ward",
      message: `Patient admitted to ${bed.wardId?.name || "ward"} (Bed ${bed.bedNumber}).`,
      sourceId: admission?._id,
      metadata: { wardId: bed.wardId?._id },
    });

    return res.status(201).json({
      success: true,
      message: "Admission created successfully.",
      data: mapAdmission(populatedAdmission || admission),
    });
  } catch (error) {
    const status = error?.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to create admission.",
      data: null,
    });
  } finally {
    session.endSession();
  }
};

export const listAdmissions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    let doctorId = null;
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      doctorId = doctor?._id;
    }
    const filter = buildAdmissionFilter(req.query, { role: req.user.role, doctorId });
    if (req.user.role === "nurse") {
      const now = new Date();
      const assignments = await NurseAssignment.find({
        nurseUserId: req.user.id,
        status: { $in: ["scheduled", "active"] },
        $or: [{ assignmentEnd: { $exists: false } }, { assignmentEnd: null }, { assignmentEnd: { $gte: now } }],
      }).select("wardId");
      const wardIds = [...new Set(assignments.map((a) => a.wardId).filter(Boolean))];
      if (!wardIds.length) {
        return res.json({
          success: true,
          message: "Admissions fetched successfully.",
          data: { items: [], page, limit, total: 0, totalPages: 1 },
        });
      }
      filter.wardId = { $in: wardIds };
    }

    const [total, admissions] = await Promise.all([
      Admission.countDocuments(filter),
      Admission.find(filter)
        .populate({ path: "patientProfileId", populate: { path: "userId", select: "name patientId" } })
        .populate("bedId", "bedNumber status")
        .populate("wardId", "name wardNumber")
        .populate("departmentId", "name")
        .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
        .sort({ admissionDate: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.json({
      success: true,
      message: "Admissions fetched successfully.",
      data: {
        items: admissions.map(mapAdmission),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

export const getAdmissionById = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate({ path: "patientProfileId", populate: { path: "userId", select: "name patientId" } })
      .populate("bedId", "bedNumber status")
      .populate("wardId", "name wardNumber")
      .populate("departmentId", "name")
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } });

    if (!admission) {
      return res.status(404).json({ success: false, message: "Admission not found.", data: null });
    }

    return res.json({
      success: true,
      message: "Admission fetched successfully.",
      data: mapAdmission(admission),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

export const logAdmissionAudit = async ({ req, admission, action, details }) => {
  await logAudit({
    actor: { id: req.user.id, name: req.user.name, role: req.user.role },
    action,
    entityType: "Admission",
    entityId: admission._id,
    details,
  });
};
