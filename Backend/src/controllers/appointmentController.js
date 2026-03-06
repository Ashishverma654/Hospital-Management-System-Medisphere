import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, slot } = req.body;
    const patientId = req.user.id;

    // Search by _id or userId to be more flexible
    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: doctorId });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const actualDoctorId = doctor._id;

    const existingAppointment = await Appointment.findOne({
      doctorId: actualDoctorId,
      date,
      slot,
      status: "booked",
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
