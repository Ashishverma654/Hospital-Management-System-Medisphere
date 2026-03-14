import Report from "../models/Report.js";
import Doctor from "../models/Doctor.js";
import { resolvePatientContext } from "../utils/patientContext.js";

export const uploadReport = async (req, res) => {
  try {
    const { patientId, appointmentId } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    const { patient, user } = await resolvePatientContext(patientId);

    const report = await Report.create({
      patientId: user._id,
      patientProfileId: patient._id,
      appointmentId,
      doctorId: doctor._id,
      reportUrl: req.file.path,
      reportName: req.file.originalname,
    });

    res.status(201).json({
      message: "Report uploaded Successfully",
      report,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientReports = async (req, res) => {
  try {
    const patientId = req.user.id;

    const reports = await Report.find({ patientId })
      .populate("doctorId")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyReports = async (req, res) => {
  try {
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found." });
      }
      const reports = await Report.find({ doctorId: doctor._id })
        .populate({ path: "patientProfileId", populate: { path: "userId", select: "name email patientId" } })
        .sort({ createdAt: -1 });
      return res.json(reports);
    }

    return getPatientReports(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
