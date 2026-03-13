import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import LabOrder from "../models/LabOrder.js";
import Prescription from "../models/Prescription.js";
import LabReport from "../models/LabReport.js";
import { generateSlots } from "../utils/generateSlots.js";
import { sendEmail } from "../utils/sendEmail.js";
import { resolvePatientContext } from "../utils/patientContext.js";
import { notifyPatient } from "../services/notificationService.js";
import { logAudit } from "../services/auditLogService.js";

const OCCUPIED_SLOT_STATUSES = ["booked", "confirmed", "arrived", "waiting", "checked-in", "inConsultation", "completed"];

export const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      date,
      slot,
      patientId: providedPatientId,
      visitType = "newConsultation",
      consultationMode = "in-person",
      reasonForVisit,
      notes,
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
    const dateObj = new Date(`${date}T00:00:00Z`);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const day = days[dateObj.getUTCDay()];

    const availability = await DoctorAvailability.findOne({
      doctorId: actualDoctorId,
      dayOfWeek: day,
    });

    if (!availability) {
      return res
        .status(400)
        .json({ message: `Doctor not available on ${day}` });
    }

    const allSlots = generateSlots(
      availability.startTime,
      availability.endTime,
      availability.slotDuration,
    );

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
      date,
      slot,
      visitType,
      consultationMode,
      reasonForVisit,
      notes,
      bookingSource:
        req.user.role === "receptionist"
          ? "receptionDesk"
          : req.user.role === "admin" || req.user.role === "superadmin"
            ? "admin"
            : "patientPortal",
      status: visitType === "walkIn" ? "arrived" : "booked",
      checkInAt: visitType === "walkIn" ? new Date() : undefined,
      checkedInBy: visitType === "walkIn" ? req.user.id : undefined,
      createdBy: req.user.id,
    });

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

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "appointment_booked",
      entityType: "Appointment",
      entityId: appointment._id,
      details: { date: appointment.date, slot: appointment.slot, doctorId: appointment.doctorId },
    });

    await sendEmail(
      patientUser.email,
      "Appointment Confirmed",
      `Your appointment has been booked successfully for ${appointment.date}.`
    );

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
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    await appointment.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "appointment_cancelled",
      entityType: "Appointment",
      entityId: appointment._id,
      details: { reason: appointment.cancellationReason },
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

    appointment.status = "completed";

    await appointment.save();

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
      doctorId,
      departmentId,
      status,
      search,
    } = req.query;

    const filter = { date };
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
      .sort({ slot: 1, createdAt: 1 });

    return res.json({
      date,
      appointments,
      summary: {
        total: appointments.length,
        booked: appointments.filter((item) => item.status === "booked").length,
        arrived: appointments.filter((item) => item.status === "arrived").length,
        waiting: appointments.filter((item) => item.status === "waiting").length,
        cancelled: appointments.filter((item) => item.status === "cancelled").length,
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
    appointment.checkedInBy = req.user.id;
    await appointment.save();

    return res.json({
      message: "Patient marked as arrived.",
      appointment,
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

    const dateObj = new Date(`${date}T00:00:00Z`);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[dateObj.getUTCDay()];

    const availability = await DoctorAvailability.findOne({
      doctorId: appointment.doctorId,
      dayOfWeek: day,
    });

    if (!availability) {
      return res.status(400).json({ message: `Doctor not available on ${day}` });
    }

    const allSlots = generateSlots(
      availability.startTime,
      availability.endTime,
      availability.slotDuration,
    );

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

    return res.json({
      message: "Appointment rescheduled successfully.",
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

    appointment.status = "inConsultation";
    await appointment.save();

    res.json({
      message: "Consultation started.",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Group by status
    const grouped = {
      pending: appointments.filter((a) => ["booked", "confirmed"].includes(a.status)),
      inProgress: appointments.filter((a) => ["arrived", "checked-in", "inConsultation"].includes(a.status)),
      completed: appointments.filter((a) => a.status === "completed"),
      cancelled: appointments.filter((a) => a.status === "cancelled"),
    };

    res.json({
      success: true,
      data: appointments,
      summary: {
        total: appointments.length,
        pending: grouped.pending.length,
        inProgress: grouped.inProgress.length,
        completed: grouped.completed.length,
        cancelled: grouped.cancelled.length,
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

    // Get recent prescriptions
    const recentPrescriptions = await Prescription.find({ patientId: patient._id })
      .limit(3)
      .sort({ createdAt: -1 })
      .populate("appointmentId", "date slot");

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
        },
        recentPrescriptions,
        recentLabOrders,
        recentLabReports,
        appointmentHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
