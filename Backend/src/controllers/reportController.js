import Report from "../models/Report.js";
import Doctor from "../models/Doctor.js";

export const uploadReport = async (req, res) => {
  try {
    const { patientId, appointmentId } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    const report = await Report.create({
      patientId,
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
