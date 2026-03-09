import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import { generateSlots } from "../utils/generateSlots.js";
import { sendEmail } from "../utils/sendEmail.js";

export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, slot, patientId: providedPatientId } = req.body;

    // If user is admin/receptionist, they can provide patientId. Else use current user.
    const patientId =
      (req.user.role === "admin" || req.user.role === "receptionist") &&
        providedPatientId
        ? providedPatientId
        : req.user.id;

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
      status: { $in: ["booked", "completed"] },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "Slot already booked." });
    }

    const appointment = await Appointment.create({
      doctorId: actualDoctorId,
      patientId,
      date,
      slot,
    });

    res.status(201).json({
      message: "Appointment booked successfully.",
      appointment,
    });

    const patient = await User.findById(req.user.id);

    await sendEmail(
      patient.email,
      "Appointment Confirmed",
      `Your appointment has been booked successfully for ${appointment.date}.`
    );

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const filter = req.user.role === "patient" ? { patientId: req.user.id } : {};
    const appointments = await Appointment.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name email" },
      })
      .populate("patientId", "name email");
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

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

    await appointment.save();

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
