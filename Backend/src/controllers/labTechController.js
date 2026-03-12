import LabTechnician from "../models/LabTechnician.js";
import LabReport from "../models/LabReport.js";

// Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const tech = await LabTechnician.findOne({ userId: req.user.id });
    const pendingReports = await LabReport.countDocuments({ uploadedBy: null });
    const myUploads = await LabReport.countDocuments({ uploadedBy: req.user.id });
    res.json({
      labSection: tech?.labSection || "Not assigned",
      pendingReports,
      myUploads,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get profile
export const getMyProfile = async (req, res) => {
  try {
    const tech = await LabTechnician.findOne({ userId: req.user.id })
      .populate("userId", "name email phone gender profileImage employeeId")
      .populate("departmentId", "name");
    if (!tech) return res.status(404).json({ message: "Lab Technician profile not found." });
    res.json(tech);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profile
export const updateMyProfile = async (req, res) => {
  try {
    const { labSection, certifications } = req.body;
    let tech = await LabTechnician.findOne({ userId: req.user.id });
    if (!tech) {
      tech = await LabTechnician.create({ userId: req.user.id, ...req.body });
    } else {
      if (labSection) tech.labSection = labSection;
      if (certifications) tech.certifications = certifications;
      await tech.save();
    }
    res.json({ message: "Profile updated.", tech });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending lab reports (ordered by doctors but not yet uploaded)
export const getPendingReports = async (req, res) => {
  try {
    const reports = await LabReport.find({ reportFile: { $exists: false } })
      .populate("patientId", "userId")
      .populate("doctorId", "userId specialization")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
