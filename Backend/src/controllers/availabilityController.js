import mongoose from "mongoose";
import DoctorAvailability from "../models/DoctorAvailability.js";
import Doctor from "../models/Doctor.js";

export const createAvailability = async (req, res) => {
  try {
    const { doctorId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: doctorId });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor record not found." });
    }

    const availability = await DoctorAvailability.create({
      doctorId: doctor._id,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
    });

    res.status(201).json({
      message: "Availability Created.",
      availability,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailabilityByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;

    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: doctorId });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor record not found." });
    }

    const availability = await DoctorAvailability.find({ doctorId: doctor._id });

    if (!availability || availability.length === 0) {
      return res.status(404).json({ message: "No availability found." });
    }

    res.status(200).json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
