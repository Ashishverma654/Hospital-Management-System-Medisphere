import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import LabTest from "../models/LabTest.js";
import LabRecommendation from "../models/LabRecommendation.js";
import TestPrice from "../models/TestPrice.js";
import { resolvePatientContext } from "../utils/patientContext.js";
import { logAudit } from "../services/auditLogService.js";
import { createLabOrderFromRecommendation } from "./labOrderController.js";

const normalizeTests = async ({ tests, doctor }) => {
  if (!Array.isArray(tests) || tests.length === 0) {
    throw new Error("At least one lab test must be selected.");
  }

  const seenKeys = new Set();
  const normalizedTests = [];

  for (const test of tests) {
    const key = test.testId || test.testCode || test.testName;
    if (key && seenKeys.has(String(key))) {
      throw new Error("Duplicate tests are not allowed in the same recommendation.");
    }
    if (key) seenKeys.add(String(key));

    if (test.testId) {
      const labTest = await LabTest.findById(test.testId);
      if (!labTest) {
        throw new Error("Lab test not found.");
      }

      const priceRecord = await TestPrice.findOne({
        testId: labTest._id,
        $or: [{ department: doctor.departmentId }, { department: { $exists: false } }, { department: null }],
      }).sort({ department: -1 });

      if (!priceRecord) {
        throw new Error(`Price not set for ${labTest.name}.`);
      }

      normalizedTests.push({
        testId: labTest._id,
        testType: labTest.testType,
        testName: labTest.name,
        testCode: test.testCode || "",
        price: Number(priceRecord.price || 0),
      });
      continue;
    }

    if (!test.testName) {
      throw new Error("Test name is required.");
    }

    normalizedTests.push({
      testName: test.testName,
      testCode: test.testCode || "",
      price: Number(test.price || 0),
    });
  }

  return normalizedTests;
};

export const createLabRecommendation = async (req, res) => {
  try {
    const { patientId, appointmentId, tests, notes, urgency = "routine" } = req.body;
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(403).json({ message: "Doctor profile not found." });
    }

    let appointment = null;
    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
      appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found." });
      }
      if (String(appointment.doctorId) !== String(doctor._id)) {
        return res.status(403).json({
          message: "You are not authorized to recommend lab tests for this appointment.",
        });
      }
    }

    const { patient, user } = await resolvePatientContext(patientId);
    const normalizedTests = await normalizeTests({ tests, doctor });

    const recommendation = await LabRecommendation.create({
      patientId: patient._id,
      patientUserId: user._id,
      doctorId: doctor._id,
      appointmentId: appointment?._id || null,
      tests: normalizedTests,
      urgency,
      notes,
      createdByUserId: req.user.id,
    });

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "lab_recommendation_created",
      entityType: "LabRecommendation",
      entityId: recommendation._id,
      details: { urgency, testCount: normalizedTests.length },
    });

    res.status(201).json({
      success: true,
      message: "Lab tests recommended successfully.",
      data: recommendation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorRecommendations = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(403).json({ message: "Doctor profile not found." });
    }

    const recommendations = await LabRecommendation.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 })
      .populate({ path: "patientId", populate: { path: "userId", select: "name patientId" } });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientRecommendations = async (req, res) => {
  try {
    const { patient, user } = await resolvePatientContext(req.user.id);
    const recommendations = await LabRecommendation.find({
      patientId: patient._id,
      patientUserId: user._id,
    })
      .sort({ createdAt: -1 })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name employeeId" } });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markRecommendationExternal = async (req, res) => {
  try {
    const { notes } = req.body;
    const { patient, user } = await resolvePatientContext(req.user.id);
    const recommendation = await LabRecommendation.findById(req.params.id);
    if (!recommendation) {
      return res.status(404).json({ message: "Lab recommendation not found." });
    }
    if (
      String(recommendation.patientId) !== String(patient._id) ||
      String(recommendation.patientUserId) !== String(user._id)
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    recommendation.status = "external";
    recommendation.externalNotes = notes || recommendation.externalNotes;
    recommendation.declinedAt = new Date();
    await recommendation.save();

    res.json({ success: true, message: "Marked as external lab test.", data: recommendation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const placeRecommendationOrder = async (req, res) => {
  try {
    const { patient, user } = await resolvePatientContext(req.user.id);
    const recommendation = await LabRecommendation.findById(req.params.id);
    if (!recommendation) {
      return res.status(404).json({ message: "Lab recommendation not found." });
    }
    if (
      String(recommendation.patientId) !== String(patient._id) ||
      String(recommendation.patientUserId) !== String(user._id)
    ) {
      return res.status(403).json({ message: "Access denied." });
    }
    if (recommendation.status === "ordered" || recommendation.labOrderId) {
      return res.status(400).json({ message: "This recommendation is already ordered." });
    }

    const labOrder = await createLabOrderFromRecommendation({
      recommendation,
      patient,
      user,
      createdBy: req.user.id,
    });

    recommendation.status = "ordered";
    recommendation.labOrderId = labOrder._id;
    recommendation.orderedAt = new Date();
    await recommendation.save();

    res.status(201).json({
      success: true,
      message: "Lab order placed successfully.",
      data: labOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
