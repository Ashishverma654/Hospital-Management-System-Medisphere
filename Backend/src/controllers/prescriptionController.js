import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, medicines, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Security: Check if the logged-in doctor is the one assigned to this appointment
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: "Access Forbidden: You are not the assigned doctor for this appointment." });
    }

    if (appointment.status === "cancelled") {
        return res.status(400).json({ message: "Cannot create prescription for a cancelled appointment." });
    }

    const prescription = await Prescription.create({
      appointmentId,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      diagnosis,
      medicines,
      notes,
    });

    // Update appointment status to completed
    appointment.status = "completed";
    await appointment.save();

    res.status(201).json({ message: "Prescription created.", prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.id;

    const prescriptions = await Prescription.find({
      patientId,
    }).populate("doctorId");

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
