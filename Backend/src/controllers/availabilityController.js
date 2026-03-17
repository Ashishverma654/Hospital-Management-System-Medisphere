import DoctorAvailability from "../models/DoctorAvailability.js";
import Doctor from "../models/Doctor.js";

const toMinutes = (value = "00:00") => {
  const [h, m] = value.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const hasOverlap = (start, end, existing = []) =>
  existing.some((item) => Math.max(start, toMinutes(item.startTime)) < Math.min(end, toMinutes(item.endTime)));

export const createAvailability = async (req, res) => {
  try {
    const { doctorId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    if ((startH > endH) || (startH === endH && startM >= endM)) {
        return res.status(400).json({ message: "startTime must be earlier than endTime." });
    }

    if (Number(slotDuration) <= 0) {
      return res.status(400).json({ message: "slotDuration must be a positive number." });
    }

    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: doctorId });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor record not found." });
    }

    const actualDoctorId = doctor._id;

    const existingRanges = await DoctorAvailability.find({
      doctorId: actualDoctorId,
      dayOfWeek,
    });

    if (hasOverlap(toMinutes(startTime), toMinutes(endTime), existingRanges)) {
      return res.status(400).json({ message: "Availability overlaps with an existing range." });
    }

    const availability = await DoctorAvailability.create({
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

export const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

    const availability = await DoctorAvailability.findById(id);
    if (!availability) {
      return res.status(404).json({ message: "Availability not found." });
    }

    const nextDay = dayOfWeek || availability.dayOfWeek;
    const nextStart = startTime || availability.startTime;
    const nextEnd = endTime || availability.endTime;
    const nextDuration = slotDuration ?? availability.slotDuration;

    const [startH, startM] = nextStart.split(":").map(Number);
    const [endH, endM] = nextEnd.split(":").map(Number);
    if ((startH > endH) || (startH === endH && startM >= endM)) {
      return res.status(400).json({ message: "startTime must be earlier than endTime." });
    }
    if (Number(nextDuration) <= 0) {
      return res.status(400).json({ message: "slotDuration must be a positive number." });
    }

    const existingRanges = await DoctorAvailability.find({
      doctorId: availability.doctorId,
      dayOfWeek: nextDay,
      _id: { $ne: availability._id },
    });

    if (hasOverlap(toMinutes(nextStart), toMinutes(nextEnd), existingRanges)) {
      return res.status(400).json({ message: "Availability overlaps with an existing range." });
    }

    availability.dayOfWeek = nextDay;
    availability.startTime = nextStart;
    availability.endTime = nextEnd;
    availability.slotDuration = nextDuration;
    await availability.save();

    return res.status(200).json({ message: "Availability updated.", availability });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DoctorAvailability.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Availability not found." });
    }
    return res.status(200).json({ message: "Availability deleted." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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

    const availability = await DoctorAvailability.find({ doctorId: doctor._id }).sort({ dayOfWeek: 1, startTime: 1 });
    res.status(200).json(Array.isArray(availability) ? availability : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
