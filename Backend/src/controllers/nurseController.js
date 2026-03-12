import Nurse from "../models/Nurse.js";
import User from "../models/User.js";

// Get nurse profile for logged-in nurse
export const getMyProfile = async (req, res) => {
  try {
    const nurse = await Nurse.findOne({ userId: req.user.id })
      .populate("userId", "name email phone gender profileImage employeeId")
      .populate("departmentId", "name")
      .populate("assignedDoctors", "specialization");
    if (!nurse) return res.status(404).json({ message: "Nurse profile not found." });
    res.json(nurse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update nurse profile
export const updateMyProfile = async (req, res) => {
  try {
    const { assignedWard, shift, specialization } = req.body;
    let nurse = await Nurse.findOne({ userId: req.user.id });
    if (!nurse) {
      nurse = await Nurse.create({ userId: req.user.id, ...req.body });
    } else {
      if (assignedWard) nurse.assignedWard = assignedWard;
      if (shift) nurse.shift = shift;
      if (specialization) nurse.specialization = specialization;
      await nurse.save();
    }
    res.json({ message: "Profile updated.", nurse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get nurse dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const nurse = await Nurse.findOne({ userId: req.user.id });
    res.json({
      assignedWard: nurse?.assignedWard || "Not assigned",
      shift: nurse?.shift || "Not set",
      assignedDoctorsCount: nurse?.assignedDoctors?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
