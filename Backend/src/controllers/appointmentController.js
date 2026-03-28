import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Invoice from "../models/Invoice.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import LabOrder from "../models/LabOrder.js";
import Prescription from "../models/Prescription.js";
import PharmacyOrder from "../models/PharmacyOrder.js";
import LabReport from "../models/LabReport.js";
import Vitals from "../models/Vitals.js";
import NursingNote from "../models/NursingNote.js";
import Token from "../models/Token.js";
import { generateSlots } from "../utils/generateSlots.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendSms } from "../utils/sendSms.js";
import { resolvePatientContext } from "../utils/patientContext.js";
import { notifyEmployee, notifyPatient, notifyRole } from "../services/notificationService.js";
import { logAudit } from "../services/auditLogService.js";
import { emitToRoom } from "../services/socketService.js";

const OCCUPIED_SLOT_STATUSES = ["booked", "confirmed", "arrived", "waiting", "checked-in", "inConsultation", "completed"];
const QUEUE_ACTIVE_STATUSES = ["booked", "confirmed", "arrived", "waiting", "checked-in", "inConsultation"];
const DEFAULT_WAIT_MINUTES = Number(process.env.QUEUE_AVG_WAIT_MINUTES || 15);

const parseSlotToMinutes = (slot = "") => {
  const trimmed = `${slot}`.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3].toUpperCase();
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const [rawHours, rawMinutes] = trimmed.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const buildSlotDateTime = (date, slot) => {
  if (!date) return null;
  const minutes = parseSlotToMinutes(slot);
  if (minutes == null) return null;
  const base = new Date(`${date}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return base;
};

const getQueueSortKey = (appointment) => {
  const priorityRank = appointment.priority === "Emergency" ? 0 : 1;
  const arrivalTime = appointment.arrivalTime || appointment.checkInAt || appointment.createdAt || new Date(0);
  const tokenNumber = appointment.tokenNumber || Number.MAX_SAFE_INTEGER;
  return { priorityRank, arrivalTime, tokenNumber };
};

const sortQueue = (appointments) =>
  [...appointments].sort((a, b) => {
    const aKey = getQueueSortKey(a);
    const bKey = getQueueSortKey(b);
    if (aKey.priorityRank !== bKey.priorityRank) return aKey.priorityRank - bKey.priorityRank;
    if (aKey.arrivalTime?.getTime && bKey.arrivalTime?.getTime) {
      const timeDiff = aKey.arrivalTime.getTime() - bKey.arrivalTime.getTime();
      if (timeDiff !== 0) return timeDiff;
    }
    return aKey.tokenNumber - bKey.tokenNumber;
  });

const buildQueueMeta = (sortedQueue) => {
  const activeQueue = sortedQueue.filter((item) => QUEUE_ACTIVE_STATUSES.includes(item.status));
  const queuePositionMap = new Map(activeQueue.map((item, index) => [String(item._id), index + 1]));
  const estimatedWaitMap = new Map(
    activeQueue.map((item, index) => [String(item._id), index * DEFAULT_WAIT_MINUTES])
  );
  return {
    activeQueue,
    queuePositionMap,
    estimatedWaitMap,
    waitingCount: activeQueue.length,
  };
};

const attachTokenMetadata = async (appointments) => {
  if (!appointments.length) return appointments;
  const tokens = await Token.find({ appointmentId: { $in: appointments.map((a) => a._id) } }).select(
    "appointmentId tokenNumber status"
  );
  const tokenMap = new Map(tokens.map((t) => [String(t.appointmentId), t]));

  return appointments.map((appointment) => {
    const token = tokenMap.get(String(appointment._id));
    return {
      ...appointment.toObject(),
      tokenNumber: token?.tokenNumber,
      tokenStatus: token?.status,
    };
  });
};

const createTokenForAppointment = async ({ appointment, doctor, session }) => {
  const existing = await Token.findOne({ appointmentId: appointment._id }).session(session || null);
  if (existing) return existing;
  const lastToken = await Token.findOne({ doctorId: appointment.doctorId, date: appointment.date })
    .sort({ tokenNumber: -1 })
    .session(session || null);
  const tokenNumber = (lastToken?.tokenNumber || 0) + 1;
  const [created] = await Token.create(
    [
      {
        appointmentId: appointment._id,
        tokenNumber,
        doctorId: appointment.doctorId,
        departmentId: doctor?.departmentId,
        date: appointment.date,
        status: "Waiting",
        issuedAt: new Date(),
      },
    ],
    { session }
  );
  if (!appointment.tokenNumber) {
    appointment.tokenNumber = created.tokenNumber;
    await appointment.save({ session });
  }
  return created;
};

const emitQueueUpdate = (appointment) => {
  emitToRoom(`doctor_${appointment.doctorId}`, "queue:update", {
    appointmentId: appointment._id,
    doctorId: appointment.doctorId,
    status: appointment.status,
  });
  emitToRoom("reception", "queue:update", {
    appointmentId: appointment._id,
    doctorId: appointment.doctorId,
    status: appointment.status,
  });
};

const buildSlotsForDay = (availabilities = []) => {
  const slots = availabilities
    .flatMap((range) => generateSlots(range.startTime, range.endTime, range.slotDuration))
    .filter(Boolean);
  return Array.from(new Set(slots)).sort();
};

const resolveConsultationFee = ({ doctor, consultationMode, hospitalLocationId }) => {
  if (!doctor) return 0;
  if (consultationMode === "video" && doctor.consultationFeeVideo != null) {
    return Number(doctor.consultationFeeVideo || 0);
  }
  if (consultationMode === "phone" && doctor.consultationFeePhone != null) {
    return Number(doctor.consultationFeePhone || 0);
  }
  if (consultationMode === "in-person" && hospitalLocationId) {
    const match = (doctor.locationFees || []).find(
      (item) => `${item.locationId}` === `${hospitalLocationId}` || `${item.locationId?._id}` === `${hospitalLocationId}`
    );
    if (match && match.fee != null) {
      return Number(match.fee || 0);
    }
  }
  return Number(doctor.consultationFee || 0);
};

export const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      date,
      slot,
      patientId: providedPatientId,
      hospitalLocationId,
      visitType = "newConsultation",
      consultationMode = "in-person",
      reasonForVisit,
      notes,
      priority,
    } = req.body;

    // If user is admin/receptionist, they can provide patientId. Else use current user.
    const isDeskBookingRole = ["admin", "superadmin", "receptionist"].includes(req.user.role);

    if (isDeskBookingRole && !providedPatientId) {
      return res.status(400).json({ message: "Patient selection is required for receptionist/admin booking." });
    }

    const patientInput =
      isDeskBookingRole && providedPatientId
        ? providedPatientId
        : req.user.id;

    const { patient: patientProfile, user: patientUser } = await resolvePatientContext(patientInput);

    if (!doctorId || !date || !slot) {
      return res.status(400).json({
        message: "doctorId, date and slot are required",
      });
    }

    // Validate ObjectIds to prevent 500 crashes
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctorId format" });
    }

    // Check if the date is in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res
        .status(400)
        .json({ message: "Cannot book appointments for past dates." });
    }

    if (req.user.role === "patient") {
      const slotDateTime = buildSlotDateTime(date, slot);
      if (slotDateTime && slotDateTime.getTime() <= Date.now()) {
        return res.status(400).json({ message: "This slot has already passed. Please choose a future time." });
      }
    }

    // Search by _id or userId to be more flexible
    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: doctorId });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const actualDoctorId = doctor._id;

    // Check if slot is valid for doctor's availability
    const dateObj = new Date(`${date}T00:00:00`);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const day = days[dateObj.getDay()];

    const availability = await DoctorAvailability.find({
      doctorId: actualDoctorId,
      dayOfWeek: day,
    });

    if (!availability || availability.length === 0) {
      return res
        .status(400)
        .json({ message: `Doctor not available on ${day}` });
    }

    const allSlots = buildSlotsForDay(availability);

    if (!allSlots.includes(slot)) {
      return res
        .status(400)
        .json({ message: "Invalid slot time for this doctor." });
    }

    const existingAppointment = await Appointment.findOne({
      doctorId: actualDoctorId,
      date,
      slot,
      status: { $in: OCCUPIED_SLOT_STATUSES },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "Slot already booked." });
    }

    const appointment = await Appointment.create({
      doctorId: actualDoctorId,
      patientId: patientUser._id,
      patientProfileId: patientProfile._id,
      doctorUserId: doctor.userId,
      hospitalLocationId:
        hospitalLocationId && doctor.hospitalLocations?.some((loc) => loc.toString() === hospitalLocationId)
          ? hospitalLocationId
          : undefined,
      date,
      slot,
      visitType,
      consultationMode,
      reasonForVisit,
      notes,
      priority: priority || "Normal",
      bookingSource:
        req.user.role === "receptionist"
          ? "receptionDesk"
          : req.user.role === "admin" || req.user.role === "superadmin"
            ? "admin"
            : "patientPortal",
      status: visitType === "walkIn" ? "arrived" : "booked",
      checkInAt: visitType === "walkIn" ? new Date() : undefined,
      arrivalTime: visitType === "walkIn" ? new Date() : undefined,
      checkedInBy: visitType === "walkIn" ? req.user.id : undefined,
      createdBy: req.user.id,
    });

    if (appointment.status === "arrived") {
      const token = await createTokenForAppointment({ appointment, doctor });
      emitToRoom(`doctor_${appointment.doctorId}`, "token:generated", {
        appointmentId: appointment._id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        tokenNumber: token?.tokenNumber,
      });
      emitToRoom(`patient_${appointment.patientId}`, "token:generated", {
        appointmentId: appointment._id,
        doctorId: appointment.doctorId,
        tokenNumber: token?.tokenNumber,
      });
      emitQueueUpdate(appointment);
    }

    // Auto-create consultation invoice
    const existingInvoice = await Invoice.findOne({ appointmentId: appointment._id });
    if (!existingInvoice) {
      const doctorFee = resolveConsultationFee({
        doctor,
        consultationMode,
        hospitalLocationId: appointment.hospitalLocationId,
      });

      const createdInvoice = await Invoice.create({
        patientId: patientProfile._id,
        patientUserId: patientUser._id,
        appointmentId: appointment._id,
        billType: "consultation",
        doctorFee,
        lineItems: [
          {
            label: "Consultation Fee",
            category: "consultation",
            referenceType: "appointment",
            referenceId: appointment._id,
            quantity: 1,
            unitPrice: doctorFee,
            lineTotal: doctorFee,
            notes: consultationMode ? `Mode: ${consultationMode}` : undefined,
          },
        ],
        createdBy: req.user.id,
        updatedBy: req.user.id,
      });

      if (patientUser?.email) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const apiUrl = process.env.BACKEND_URL || "http://localhost:3500/api";
        try {
          await sendEmail(
            patientUser.email,
            "Appointment Invoice Ready",
            `Your consultation invoice is ready. View it here: ${frontendUrl}/patient/bills?invoice=${createdInvoice._id} or download PDF: ${apiUrl}/billing/${createdInvoice._id}/pdf`
          );
        } catch (emailError) {
          console.error("Invoice email failed:", emailError.message);
        }
      }
    }

    res.status(201).json({
      message: "Appointment booked successfully.",
      appointment,
    });

    await notifyPatient({
      userId: patientUser._id,
      patientId: patientProfile._id,
      key: `appointment:${appointment._id}:booked`,
      type: "appointment",
      title: "Appointment booked",
      message: `Your appointment is scheduled for ${appointment.date} at ${appointment.slot}.`,
      sourceType: "appointment",
      sourceId: appointment._id,
      metadata: { date: appointment.date, slot: appointment.slot, status: appointment.status },
    });

    await notifyRole({
      role: "receptionist",
      key: `reception:appointment:${appointment._id}:booked`,
      type: "appointment",
      title: "New appointment booked",
      message: `New appointment for ${appointment.date} at ${appointment.slot}.`,
      sourceType: "appointment",
      sourceId: appointment._id,
      metadata: { date: appointment.date, slot: appointment.slot, status: appointment.status },
    });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "appointment_booked",
      entityType: "Appointment",
      entityId: appointment._id,
      details: { date: appointment.date, slot: appointment.slot, doctorId: appointment.doctorId },
    });

    if (patientUser?.email) {
      try {
        await sendEmail(
          patientUser.email,
          "Appointment Confirmed",
          `Your appointment has been booked successfully for ${appointment.date} at ${appointment.slot}.`
        );
      } catch (emailError) {
        console.error("Appointment confirmation email failed:", emailError.message);
      }
    }
    if (patientUser?.phone) {
      try {
        await sendSms(
          patientUser.phone,
          `MediFlow: Your appointment is booked for ${appointment.date} at ${appointment.slot}.`
        );
      } catch (smsError) {
        console.error("Appointment confirmation SMS failed:", smsError.message);
      }
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const { date, status, doctorId, patientId, search, departmentId, startDate, endDate } = req.query;
    const filter = req.user.role === "patient" ? { patientId: req.user.id } : {};

    if (date) filter.date = date;
    if (!date && (startDate || endDate)) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.$or = [{ patientId }, { patientProfileId: patientId }];

    if (departmentId) {
      const doctors = await Doctor.find({ departmentId }).distinct("_id");
      filter.doctorId = doctorId ? doctorId : { $in: doctors };
    }

    if (search && req.user.role !== "patient") {
      const matchingUsers = await User.find({
        role: "patient",
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { patientId: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      filter.patientId = { $in: matchingUsers.map((user) => user._id) };
    }

    const appointments = await Appointment.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "doctorId",
        populate: [
          { path: "userId", select: "name email phone" },
          { path: "departmentId", select: "name" },
        ],
      })
      .populate("patientId", "name email phone patientId")
      .populate({
        path: "patientProfileId",
        populate: { path: "userId", select: "name email patientId" },
      });
    const withTokens = await attachTokenMetadata(appointments);
    const grouped = new Map();
    withTokens.forEach((appointment) => {
      const key = `${appointment.doctorId?._id || appointment.doctorId}-${appointment.date}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(appointment);
    });

    const queueMetaByKey = new Map();
    grouped.forEach((groupAppointments, key) => {
      const sortedQueue = sortQueue(groupAppointments);
      const meta = buildQueueMeta(sortedQueue);
      queueMetaByKey.set(key, meta);
    });

    const enriched = withTokens.map((item) => {
      const key = `${item.doctorId?._id || item.doctorId}-${item.date}`;
      const meta = queueMetaByKey.get(key);
      return {
        ...item,
        queuePosition: meta?.queuePositionMap.get(String(item._id)) || null,
        estimatedWaitTime: meta?.estimatedWaitMap.get(String(item._id)) ?? null,
        waitingCount: meta?.waitingCount ?? null,
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAppointmentNoShow = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (!["booked", "confirmed"].includes(appointment.status)) {
      return res.status(400).json({ message: "Only booked/confirmed appointments can be marked as no-show." });
    }

    appointment.status = "no-show";
    appointment.noShowAt = new Date();
    appointment.updatedBy = req.user.id;
    await appointment.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "appointment_no_show",
      entityType: "Appointment",
      entityId: appointment._id,
      details: { date: appointment.date, slot: appointment.slot },
    });

    emitQueueUpdate(appointment);

    return res.json({ message: "Appointment marked as no-show.", appointment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Ownership check: Only the patient themselves, an admin, or a receptionist can cancel.
    if (
      req.user.role === "patient" &&
      appointment.patientId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Access Forbidden: You can only cancel your own appointments.",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        message: "Completed appointments cannot be cancelled.",
      });
    }

    if (appointment.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Appointment is already cancelled." });
    }

    appointment.status = "cancelled";
    appointment.cancellationReason = reason || appointment.cancellationReason;
    appointment.cancelReason = reason || appointment.cancelReason;
    appointment.cancelledBy = req.user.id;
    appointment.cancelledAt = new Date();

    await appointment.save();

    const patientUser = await User.findById(appointment.patientId).select("name email phone patientId");
    const cancellationReason = appointment.cancellationReason || appointment.cancelReason;

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "appointment_cancelled",
      entityType: "Appointment",
      entityId: appointment._id,
      details: { reason: appointment.cancellationReason },
    });

    emitQueueUpdate(appointment);

    if (patientUser?.email) {
      const cancelText = [
        `Your appointment on ${appointment.date} at ${appointment.slot} has been cancelled.`,
        cancellationReason ? `Reason: ${cancellationReason}` : null,
      ]
        .filter(Boolean)
        .join(" ");

      try {
        await sendEmail(patientUser.email, "Appointment Cancelled", cancelText);
      } catch (emailError) {
        console.error("Appointment cancellation email failed:", emailError.message);
      }
    }

    await notifyPatient({
      userId: appointment.patientId,
      patientId: appointment.patientProfileId,
      key: `appointment:${appointment._id}:cancelled`,
      type: "appointment",
      title: "Appointment cancelled",
      message: `Your appointment on ${appointment.date} at ${appointment.slot} was cancelled.`,
      sourceType: "appointment",
      sourceId: appointment._id,
      metadata: { date: appointment.date, slot: appointment.slot, status: appointment.status },
    });

    res.json({ message: "Appointment cancelled Successfully." });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getTodayAppointments = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    const doctor = await Doctor.findOne({ userId: doctorUserId });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor Profile Not Found.",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      date: today,
      status: "booked",
    })
      .populate("patientId", "name email phone")
      .sort({ slot: -1 });

    res.json({ date: today, appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    const doctor = await Doctor.findOne({ userId: doctorUserId });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor Profile not found.",
      });
    }

    const appointments = await Appointment.find({
      doctorId: doctor._id,
    })
      .populate("patientId", "name email phone")
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not Found." });
    }

    if (appointment.status !== "inConsultation") {
      return res.status(400).json({
        message: "Consultation must be started before completion.",
      });
    }

    appointment.status = "completed";

    await appointment.save();

    await Token.findOneAndUpdate(
      { appointmentId: appointment._id },
      { $set: { status: "Completed" } },
      { returnDocument: "after" }
    );

    emitToRoom(`doctor_${appointment.doctorId}`, "consultation:completed", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
    });
    emitToRoom(`patient_${appointment.patientId}`, "consultation:completed", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
    });
    emitQueueUpdate(appointment);

    res.json({
      message: "Appointment marked as Completed.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const history = await Appointment.find({
      patientId,
    })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name email phone profileImage" },
      })
      .sort({ date: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReceptionQueue = async (req, res) => {
  try {
    const {
      date = new Date().toISOString().split("T")[0],
      scope,
      startDate,
      endDate,
      doctorId,
      departmentId,
      status,
      search,
    } = req.query;

    let filter = {};
    if (scope === "upcoming") {
      const today = new Date().toISOString().split("T")[0];
      filter.date = { $gt: today };
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = startDate;
        if (endDate) filter.date.$lte = endDate;
      }
    } else {
      filter = { date };
    }
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;

    if (departmentId) {
      const doctors = await Doctor.find({ departmentId }).distinct("_id");
      filter.doctorId = doctorId ? doctorId : { $in: doctors };
    }

    if (search) {
      const matchingUsers = await User.find({
        role: "patient",
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { patientId: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      filter.patientId = { $in: matchingUsers.map((user) => user._id) };
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email phone patientId")
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ date: 1, slot: 1, createdAt: 1 });

    const appointmentsWithTokens = await attachTokenMetadata(appointments);
    const sortedQueue = sortQueue(appointmentsWithTokens);
    const { queuePositionMap, estimatedWaitMap, waitingCount } = buildQueueMeta(sortedQueue);

    return res.json({
      date,
      appointments: sortedQueue.map((item) => ({
        ...item,
        queuePosition: queuePositionMap.get(String(item._id)) || null,
        estimatedWaitTime: estimatedWaitMap.get(String(item._id)) ?? null,
        waitingCount,
      })),
      summary: {
        total: appointments.length,
        booked: appointments.filter((item) => item.status === "booked").length,
        arrived: appointments.filter((item) => item.status === "arrived").length,
        waiting: appointments.filter((item) => item.status === "waiting").length,
        cancelled: appointments.filter((item) => item.status === "cancelled").length,
        waitingCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markAppointmentArrived = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (["completed", "cancelled", "no-show"].includes(appointment.status)) {
      return res.status(400).json({ message: "This appointment cannot be checked in." });
    }

    appointment.status = "arrived";
    appointment.checkInAt = new Date();
    appointment.arrivalTime = appointment.checkInAt;
    appointment.checkedInBy = req.user.id;

    if (!appointment.doctorUserId) {
      const doctor = await Doctor.findById(appointment.doctorId);
      if (doctor?.userId) {
        appointment.doctorUserId = doctor.userId;
      }
    }
    await appointment.save();

    const doctor = await Doctor.findById(appointment.doctorId);
    const token = await createTokenForAppointment({ appointment, doctor });
    emitToRoom(`doctor_${appointment.doctorId}`, "token:generated", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      tokenNumber: token?.tokenNumber,
    });
    emitToRoom(`patient_${appointment.patientId}`, "token:generated", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      tokenNumber: token?.tokenNumber,
    });
    emitQueueUpdate(appointment);

    const doctorUserId = appointment.doctorUserId || doctor?.userId;
      if (doctorUserId) {
        await notifyEmployee({
          userId: doctorUserId,
          key: `appointment:${appointment._id}:arrived`,
          type: "appointment",
          title: "Patient arrived",
          message: "A patient has checked in for the appointment.",
          sourceType: "appointment",
          sourceId: appointment._id,
        });
      }

      await notifyRole({
        role: "receptionist",
        key: `reception:appointment:${appointment._id}:arrived`,
        type: "appointment",
        title: "Patient arrived",
        message: "A patient has checked in for the appointment.",
        sourceType: "appointment",
        sourceId: appointment._id,
        metadata: { status: appointment.status },
      });

    return res.json({
      message: "Patient marked as arrived.",
      appointment: {
        ...appointment.toObject(),
        tokenNumber: token?.tokenNumber,
        tokenStatus: token?.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const { date, slot } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (!date || !slot) {
      return res.status(400).json({ message: "New date and slot are required." });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({ message: "Cannot reschedule to a past date." });
    }

    const dateObj = new Date(`${date}T00:00:00`);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[dateObj.getDay()];

    const availability = await DoctorAvailability.find({
      doctorId: appointment.doctorId,
      dayOfWeek: day,
    });

    if (!availability || availability.length === 0) {
      return res.status(400).json({ message: `Doctor not available on ${day}` });
    }

    const allSlots = buildSlotsForDay(availability);

    if (!allSlots.includes(slot)) {
      return res.status(400).json({ message: "Invalid slot time for this doctor." });
    }

    const existingAppointment = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: appointment.doctorId,
      date,
      slot,
      status: { $in: OCCUPIED_SLOT_STATUSES },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "Selected slot is already booked." });
    }

    appointment.rescheduledFrom = {
      date: appointment.date,
      slot: appointment.slot,
      rescheduledAt: new Date(),
    };
    appointment.date = date;
    appointment.slot = slot;
    appointment.status = "booked";
    appointment.checkInAt = undefined;
    appointment.checkedInBy = undefined;
    await appointment.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "appointment_rescheduled",
      entityType: "Appointment",
      entityId: appointment._id,
      details: { date, slot },
    });

    emitQueueUpdate(appointment);

    return res.json({
      message: "Appointment rescheduled successfully.",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const recommendAdmission = async (req, res) => {
  try {
    const { admissionRecommended = true, admissionRecommendationNotes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: "Access Forbidden: You are not the assigned doctor for this appointment." });
    }

    appointment.admissionRecommended = Boolean(admissionRecommended);
    if (admissionRecommendationNotes !== undefined) {
      appointment.admissionRecommendationNotes = admissionRecommendationNotes;
    }
    await appointment.save();

    return res.json({
      message: "Admission recommendation saved.",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Doctor starts consultation on an appointment
export const startConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Security: Verify doctor ownership
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: "You are not the assigned doctor for this appointment." });
    }

    // Check if appointment is in a valid state for starting consultation
    if (!["arrived", "checked-in", "booked", "confirmed"].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot start consultation for appointment in ${appointment.status} status.`,
      });
    }

    const slotDateTime = buildSlotDateTime(appointment.date, appointment.slot);
    if (
      slotDateTime &&
      slotDateTime.getTime() > Date.now() &&
      !appointment.earlyCheckInBy
    ) {
      return res.status(400).json({
        message: "This appointment is scheduled for later. Ask reception to start early with a reason if needed.",
      });
    }

    appointment.status = "inConsultation";
    await appointment.save();

    await Token.findOneAndUpdate(
      { appointmentId: appointment._id },
      { $set: { status: "In Consultation" } },
      { returnDocument: "after" }
    );

    emitToRoom(`doctor_${appointment.doctorId}`, "consultation:started", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
    });
    emitToRoom(`patient_${appointment.patientId}`, "consultation:started", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
    });
    emitQueueUpdate(appointment);

    res.json({
      message: "Consultation started.",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const startConsultationEarly = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Early consultation reason is required." });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (["completed", "cancelled", "no-show"].includes(appointment.status)) {
      return res.status(400).json({ message: "This appointment cannot be started." });
    }

    if (!["arrived", "waiting", "checked-in"].includes(appointment.status)) {
      return res.status(400).json({ message: "Mark the patient as arrived before starting early." });
    }

    const slotDateTime = buildSlotDateTime(appointment.date, appointment.slot);
    if (slotDateTime && slotDateTime.getTime() <= Date.now()) {
      return res.status(400).json({ message: "The scheduled time has started. Ask the doctor to start the consultation." });
    }

    appointment.status = "inConsultation";
    appointment.earlyCheckInReason = reason.trim();
    appointment.earlyCheckInBy = req.user.id;
    appointment.earlyCheckInAt = new Date();
    appointment.updatedBy = req.user.id;
    await appointment.save();

    const doctor = await Doctor.findById(appointment.doctorId);
    const token = await createTokenForAppointment({ appointment, doctor });
    emitToRoom(`doctor_${appointment.doctorId}`, "token:generated", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      tokenNumber: token?.tokenNumber,
    });
    emitToRoom(`patient_${appointment.patientId}`, "token:generated", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      tokenNumber: token?.tokenNumber,
    });

    emitToRoom(`doctor_${appointment.doctorId}`, "consultation:started", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
    });
    emitToRoom(`patient_${appointment.patientId}`, "consultation:started", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
    });
    emitQueueUpdate(appointment);

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "appointment_early_started",
      entityType: "Appointment",
      entityId: appointment._id,
      details: { reason: appointment.earlyCheckInReason },
    });

    return res.json({
      message: "Consultation started early.",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get doctor's today's appointments with detailed patient info
export const getDoctorTodayDetailed = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    const doctor = await Doctor.findOne({ userId: doctorUserId });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    const today = new Date().toISOString().split("T")[0];

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      date: today,
    })
      .populate({
        path: "patientId",
        select: "name email phone gender profileImage patientId",
      })
      .populate({
        path: "patientProfileId",
        select: "age gender bloodGroup allergies chronicDiseases",
      })
      .sort({ slot: 1 });

    const withTokens = await attachTokenMetadata(appointments);
      const sortedQueue = sortQueue(withTokens);
      const { queuePositionMap, estimatedWaitMap, waitingCount } = buildQueueMeta(sortedQueue);

    // Group by status
    const grouped = {
      pending: sortedQueue.filter((a) => ["booked", "confirmed"].includes(a.status)),
      inProgress: sortedQueue.filter((a) => ["arrived", "checked-in", "inConsultation"].includes(a.status)),
      completed: sortedQueue.filter((a) => a.status === "completed"),
      cancelled: sortedQueue.filter((a) => a.status === "cancelled"),
    };

      res.json({
        success: true,
        data: sortedQueue.map((item) => ({
          ...item,
          queuePosition: queuePositionMap.get(String(item._id)) || null,
          estimatedWaitTime: estimatedWaitMap.get(String(item._id)) ?? null,
          waitingCount,
        })),
        summary: {
          total: appointments.length,
          pending: grouped.pending.length,
          inProgress: grouped.inProgress.length,
          completed: grouped.completed.length,
          cancelled: grouped.cancelled.length,
          waitingCount,
        },
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient summary for doctor consultation
export const getPatientSummary = async (req, res) => {
  try {
    const { patientId } = req.params;

    const { patient, user } = await resolvePatientContext(patientId);
    const latestVitals = await Vitals.findOne({ patientId: patient._id })
      .sort({ recordedAt: -1 })
      .select("recordedAt systolicBp diastolicBp pulse temperature spo2 respirationRate bloodSugar weight notes");
    const recentVitals = await Vitals.find({ patientId: patient._id })
      .sort({ recordedAt: -1 })
      .limit(10)
      .select("recordedAt systolicBp diastolicBp pulse temperature spo2 respirationRate bloodSugar weight notes nurseUserId")
      .populate("nurseUserId", "name");
    const nursingNotes = await NursingNote.find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("noteType content createdAt nurseUserId")
      .populate("nurseUserId", "name");

    // Get recent prescriptions
      const recentPrescriptions = await Prescription.find({ patientId: patient._id })
        .limit(3)
        .sort({ createdAt: -1 })
        .populate("appointmentId", "date slot");
      const latestPrescription = recentPrescriptions[0] || null;

      const latestPharmacyOrder = latestPrescription?.pharmacyOrderId
        ? await PharmacyOrder.findById(latestPrescription.pharmacyOrderId).select("status paymentStatus total updatedAt createdAt")
        : null;

    const recentLabOrders = await LabOrder.find({ patientId: patient._id })
      .limit(3)
      .sort({ createdAt: -1 });

    // Get recent lab reports
    const recentLabReports = await LabReport.find({ patientId: patient._id })
      .limit(3)
      .sort({ createdAt: -1 });

    // Get appointment history
    const appointmentHistory = await Appointment.find({ patientId: user._id })
      .limit(10)
      .sort({ createdAt: -1 })
      .populate("doctorId", "userId")
      .select("date slot status createdAt");

    res.json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          patientId: user.patientId,
          gender: patient.gender,
          age: patient.age,
          bloodGroup: patient.bloodGroup,
          allergies: patient.allergies,
          chronicDiseases: patient.chronicDiseases,
          height: patient.height,
          weight: patient.weight,
          maritalStatus: patient.maritalStatus,
          emergencyContact: patient.emergencyContact,
          insuranceProvider: patient.insuranceProvider,
          latestVitals: latestVitals
            ? {
                recordedAt: latestVitals.recordedAt,
                bloodPressure:
                  latestVitals.systolicBp && latestVitals.diastolicBp
                    ? `${latestVitals.systolicBp}/${latestVitals.diastolicBp}`
                    : null,
                pulse: latestVitals.pulse,
                temperature: latestVitals.temperature,
                spo2: latestVitals.spo2,
                respirationRate: latestVitals.respirationRate,
                bloodSugar: latestVitals.bloodSugar,
                weight: latestVitals.weight,
                notes: latestVitals.notes,
              }
            : null,
        },
        recentVitals: recentVitals.map((entry) => ({
          id: entry._id,
          recordedAt: entry.recordedAt,
          bloodPressure:
            entry.systolicBp && entry.diastolicBp
              ? `${entry.systolicBp}/${entry.diastolicBp}`
              : null,
          pulse: entry.pulse,
          temperature: entry.temperature,
          spo2: entry.spo2,
          respirationRate: entry.respirationRate,
          bloodSugar: entry.bloodSugar,
          weight: entry.weight,
          notes: entry.notes,
          nurseName: entry.nurseUserId?.name || "Nurse",
        })),
        nursingNotes: nursingNotes.map((note) => ({
          id: note._id,
          noteType: note.noteType,
          content: note.content,
          createdAt: note.createdAt,
          nurseName: note.nurseUserId?.name || "Nurse",
        })),
        recentPrescriptions,
          latestPrescription: latestPrescription
            ? {
                id: latestPrescription._id,
                diagnosis: latestPrescription.diagnosis,
                advice: latestPrescription.advice,
                clinicalNotes: latestPrescription.clinicalNotes,
                followUpDate: latestPrescription.followUpDate,
                admissionRecommended: Boolean(latestPrescription.admissionRecommended),
                admissionRecommendationNotes: latestPrescription.admissionRecommendationNotes,
                medicines: latestPrescription.medicines || [],
                issuedAt: latestPrescription.issuedAt || latestPrescription.createdAt,
                appointmentId: latestPrescription.appointmentId,
                pharmacyOrderId: latestPrescription.pharmacyOrderId,
              }
            : null,
          latestPharmacyOrder: latestPharmacyOrder
            ? {
                id: latestPharmacyOrder._id,
                status: latestPharmacyOrder.status,
                paymentStatus: latestPharmacyOrder.paymentStatus,
                total: latestPharmacyOrder.total,
                updatedAt: latestPharmacyOrder.updatedAt,
                createdAt: latestPharmacyOrder.createdAt,
              }
            : null,
        recentLabOrders,
        recentLabReports,
        appointmentHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorAppointmentById = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name email phone patientId")
      .populate({
        path: "patientProfileId",
        populate: { path: "userId", select: "name email patientId" },
      })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name email" },
      });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (String(appointment.doctorId?._id || appointment.doctorId) !== String(doctor._id)) {
      return res.status(403).json({ message: "Access forbidden." });
    }

    return res.json(appointment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
