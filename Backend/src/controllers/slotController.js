import DoctorAvailability from "../models/DoctorAvailability.js";
import Doctor from "../models/Doctor.js";
import { generateSlots } from "../utils/generateSlots.js";

export const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date query parameter is required." });
    }

    // Search by _id or userId to be more flexible
    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: doctorId });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Always use the internal doctor _id for availability lookup
    const actualDoctorId = doctor._id;

    // Use a UTC date to be timezone-agnostic
    const dateObj = new Date(`${date}T00:00:00Z`);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD." });
    }

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

    const day = days[dateObj.getUTCDay()];

    const availability = await DoctorAvailability.findOne({
      doctorId: actualDoctorId,
      dayOfWeek: day,
    });

    if (!availability) {
      return res
        .status(404)
        .json({ 
          message: `Doctor not available on ${day} (${date}).`,
          details: { doctorId, day, date }
        });
    }

    const slots = generateSlots(
      availability.startTime,
      availability.endTime,
      availability.slotDuration,
    );

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
