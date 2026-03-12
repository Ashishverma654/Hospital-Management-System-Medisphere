import Pharmacist from "../models/Pharmacist.js";
import Prescription from "../models/Prescription.js";
import Medicine from "../models/Medicine.js";

// Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const pharm = await Pharmacist.findOne({ userId: req.user.id });
    const totalMedicines = await Medicine.countDocuments();
    const totalPrescriptions = await Prescription.countDocuments();
    res.json({
      assignedCounter: pharm?.assignedCounter || "Not assigned",
      shift: pharm?.shift || "Not set",
      totalMedicines,
      totalPrescriptions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get profile
export const getMyProfile = async (req, res) => {
  try {
    const pharm = await Pharmacist.findOne({ userId: req.user.id })
      .populate("userId", "name email phone gender profileImage employeeId");
    if (!pharm) return res.status(404).json({ message: "Pharmacist profile not found." });
    res.json(pharm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profile
export const updateMyProfile = async (req, res) => {
  try {
    const { licenseNumber, assignedCounter, shift } = req.body;
    let pharm = await Pharmacist.findOne({ userId: req.user.id });
    if (!pharm) {
      pharm = await Pharmacist.create({ userId: req.user.id, ...req.body });
    } else {
      if (licenseNumber) pharm.licenseNumber = licenseNumber;
      if (assignedCounter) pharm.assignedCounter = assignedCounter;
      if (shift) pharm.shift = shift;
      await pharm.save();
    }
    res.json({ message: "Profile updated.", pharm });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
