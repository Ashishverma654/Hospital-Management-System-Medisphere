import DoctorAvailability from "../models/DoctorAvailability.js";

export const createAvailability = async (req, res) => {
  try {
    const { doctorId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

    const availability = await DoctorAvailability.create({
      doctorId,
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

    const availability = await DoctorAvailability.find({ doctorId });

    if (!availability || availability.length === 0) {
      return res.status(404).json({ message: "No availability found." });
    }

    res.status(200).json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
