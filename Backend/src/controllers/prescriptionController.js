import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import { generatePrescriptionPDF } from "../utils/generatePrescriptionPDF.js";
import { ensurePatientProfileForUser, resolvePatientContext } from "../utils/patientContext.js";

export const createPrescription = async (req, res) => {
  try {
    const {
      appointmentId,
      diagnosis,
      clinicalNotes,
      advice,
      medicines,
      notes,
      followUpDate,
      revisitRecommended,
      admissionRecommended,
      admissionRecommendationNotes,
    } = req.body;

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

    const { patient, user } = await resolvePatientContext(appointment.patientId);

    const prescription = await Prescription.create({
      appointmentId,
      doctorId: appointment.doctorId,
      patientId: patient._id,
      patientUserId: user._id,
      diagnosis,
      clinicalNotes,
      advice,
      medicines,
      notes,
      followUpDate,
      revisitRecommended,
      admissionRecommended,
      admissionRecommendationNotes,
    });

    // Update appointment status to completed only if not already in a terminal state
    if (!["completed", "cancelled"].includes(appointment.status)) {
      appointment.status = "completed";
      await appointment.save();
    }

    res.status(201).json({ message: "Prescription created.", prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientPrescriptions = async (req, res) => {
  try {
    const { patient } = await ensurePatientProfileForUser(req.user.id);
    const prescriptions = await Prescription.find({
      patientId: patient._id
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

export const getMyPrescriptions = async (req, res) => {
  try {
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found." });
      }
      const prescriptions = await Prescription.find({ doctorId: doctor._id })
        .sort({ createdAt: -1 })
        .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } })
        .populate("appointmentId");
      return res.status(200).json({ success: true, data: prescriptions });
    }

    return getPatientPrescriptions(req, res);
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
    }).populate("doctorId").populate({ path: "patientId", populate: { path: "userId", select: "name email patientId" } }).populate("patientUserId", "name email patientId");

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
    const { patient } = await resolvePatientContext(req.params.patientId);
    const prescriptions = await Prescription.find({
      patientId: patient._id
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
