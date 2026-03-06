import mongoose from "mongoose";
import DoctorAvailability from "../models/DoctorAvailability.js";
import Doctor from "../models/Doctor.js";

export const createAvailability = async (req, res) => {
  try {
    const { doctorId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    if ((startH > endH) || (startH === endH && startM >= endM)) {
        return res.status(400).json({ message: "startTime must be earlier than endTime." });
    }

    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: doctorId });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor record not found." });
    }

    const actualDoctorId = doctor._id;

    // Check if availability already exists for this day
    let availability = await DoctorAvailability.findOne({
      doctorId: actualDoctorId,
      dayOfWeek,
    });

    if (availability) {
      availability.startTime = startTime;
      availability.endTime = endTime;
      availability.slotDuration = slotDuration;
      await availability.save();

      return res.status(200).json({
        message: "Availability Updated.",
        availability,
      });
    }

    availability = await DoctorAvailability.create({
      doctorId: actualDoctorId,
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
