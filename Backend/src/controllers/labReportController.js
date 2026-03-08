import User from "../models/User.js";
import LabReport from "../models/LabReport.js";
import Patient from "../models/Patient.js";
import { sendEmail } from "../utils/sendEmail.js";

export const uploadLabReport = async (req, res) => {
    try {
        const report = new LabReport({
            patientId: req.body.patientId,
            doctorId: req.body.doctorId,
            appointmentId: req.body.appointmentId,
            reportName: req.body.reportName,
            reportType: req.body.reportType,
            reportFile: req.file.path,
            uploadedBy: req.user.id
        });
        await report.save();

        res.status(201).json({
            success: true,
            message: "Lab report uploaded Successfully",
            data: report
        });

        const patient = await Patient.findById(report.patientId).populate("userId");

        await sendEmail(
            patient.userId.email,
            "Lab Report Ready",
            "Your lab report has been uploaded. Please login to view it."
        );

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



export const getPatientReports = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user.id });

        const reports = await LabReport.find({
            patientId: patient._id
        }).populate("doctorId").populate("appointmentId");

        res.status(200).json({
            success: true,
            data: reports
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getReportByPatientId = async (req, res) => {
    try {
        const reports = await LabReport.find({
            patientId: req.params.patientId
        }).populate("doctorId").populate("appointmentId");

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
