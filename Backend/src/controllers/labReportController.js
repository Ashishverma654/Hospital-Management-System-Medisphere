import User from "../models/User.js";
import LabReport from "../models/LabReport.js";
import Patient from "../models/Patient.js";
import { sendEmail } from "../utils/sendEmail.js";

export const uploadLabReport = async (req, res) => {
    try {
        let targetPatientId = req.body.patientId;
        if (req.user.role === "patient") {
            targetPatientId = req.user.id;
        }

        const report = new LabReport({
            patientId: targetPatientId,
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

        // Only send email if the uploader is not the patient themselves
        if (req.user.role !== "patient" && report.patientId) {
            const uploadedTarget = await User.findById(report.patientId);
            if (uploadedTarget && uploadedTarget.email) {
                await sendEmail(
                    uploadedTarget.email,
                    "Lab Report Ready",
                    "Your lab report has been uploaded. Please login to view it."
                );
            }
        }

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



export const getPatientReports = async (req, res) => {
    try {
        const reports = await LabReport.find({
            patientId: req.user.id
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
