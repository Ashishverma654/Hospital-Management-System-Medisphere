import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { generatePrescriptionPDF } from "../utils/generatePrescriptionPDF.js";

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
    const prescriptions = await Prescription.find({
      patientId: req.user.id
    }).populate({ path: "doctorId", populate: { path: "userId", select: "name" } }).populate("appointmentId");

    res.status(200).json({
      success: true,
      data: prescriptions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getPrescriptionByAppointment = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      appointmentId: req.params.appointmentId
    }).populate("doctorId").populate("patientId");

    res.status(200).json({
      success: true,
      data: prescription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPrescriptionByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patientId: req.params.patientId
    }).populate("doctorId").populate("appointmentId");

    res.status(200).json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const downloadPrescriptionPDF = async (req, res) => {
  try {

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found"
      });
    }

    generatePrescriptionPDF(res, prescription);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};