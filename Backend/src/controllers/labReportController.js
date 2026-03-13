import User from "../models/User.js";
import LabReport from "../models/LabReport.js";
import { sendEmail } from "../utils/sendEmail.js";
import { ensurePatientProfileForUser, resolvePatientContext } from "../utils/patientContext.js";

export const uploadLabReport = async (req, res) => {
    try {
        const targetPatientInput = req.user.role === "patient" ? req.user.id : req.body.patientId;
        const { patient, user } = await resolvePatientContext(targetPatientInput);

        const report = new LabReport({
            patientId: patient._id,
            patientUserId: user._id,
            doctorId: req.body.doctorId,
            appointmentId: req.body.appointmentId,
            reportName: req.body.reportName,
            reportType: req.body.reportType,
            reportFile: req.file.path,
            uploadedBy: req.user.id,
            labOrderId: req.body.labOrderId,
            labOrderItemId: req.body.labOrderItemId,
        });
        await report.save();

        res.status(201).json({
            success: true,
            message: "Lab report uploaded Successfully",
            data: report
        });

        // Only send email if the uploader is not the patient themselves
        if (req.user.role !== "patient" && user?.email) {
                await sendEmail(
                    user.email,
                    "Lab Report Ready",
                    "Your lab report has been uploaded. Please login to view it."
                );
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
        const { patient } = await ensurePatientProfileForUser(req.user.id);
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
        const { patient } = await resolvePatientContext(req.params.patientId);
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
