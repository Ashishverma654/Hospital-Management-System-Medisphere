import LabOrder from "../models/LabOrder.js";
import LabOrderItem from "../models/LabOrderItem.js";
import LabReport from "../models/LabReport.js";
import { sendEmail } from "../utils/sendEmail.js";
import { buildLabReportReadyTemplate } from "../utils/emailTemplates.js";
import { ensurePatientProfileForUser, resolvePatientContext } from "../utils/patientContext.js";
import { getPublicReportVisibility } from "../utils/labWorkflow.js";
import { formatOrder, orderPopulate, syncLabOrderPaymentState } from "./labOrderController.js";
import { generateLabReportPDF } from "../utils/generateLabReportPDF.js";
import HospitalSettings from "../models/HospitalSettings.js";
import { EMPLOYEE_ROLES } from "../constants/roles.js";

export const uploadLabReport = async (req, res) => {
  try {
    const { labOrderId: requestedLabOrderId, labOrderItemId, reportName, reportType, patientId, doctorId, appointmentId } = req.body;
    const labOrderId = requestedLabOrderId || req.params.id;

    if (!req.file?.path) {
      return res.status(400).json({ message: "Report file is required." });
    }

    if (req.user.role === "labTechnician") {
      return res.status(403).json({ message: "Lab technicians cannot upload report files. Mark the report ready instead." });
    }

    if (!labOrderId && req.user.role === "patient") {
      const { patient, user } = await ensurePatientProfileForUser(req.user.id);
      const report = await LabReport.create({
        patientId: patient._id,
        patientUserId: user._id,
        reportName: reportName || req.file.originalname,
        reportType: reportType || "External Lab Report",
        reportFile: req.file.path,
        filePublicId: req.file.filename,
        uploadedBy: req.user.id,
        status: "uploaded",
        releasedToPortal: true,
        isSystemGenerated: false,
        releasedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Lab report uploaded successfully.",
        data: report,
      });
    }

    if (!labOrderId) {
      return res.status(400).json({ message: "Lab order is required for technician report upload." });
    }

    const order = await syncLabOrderPaymentState(labOrderId);
    if (!order) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    const { patient, user } = await resolvePatientContext(patientId || order.patientId);

    if (labOrderItemId) {
      const item = await LabOrderItem.findOne({ _id: labOrderItemId, labOrderId: order._id });
      if (!item) {
        return res.status(400).json({ message: "Selected test item does not belong to this lab order." });
      }
    }

    const report = await LabReport.create({
      patientId: patient._id,
      patientUserId: user._id,
      doctorId: doctorId || order.doctorId,
      appointmentId: appointmentId || order.appointmentId,
      reportName: reportName || req.file.originalname,
      reportType: reportType || "Lab Report",
      reportFile: req.file.path,
      filePublicId: req.file.filename,
      uploadedBy: req.user.id,
      labOrderId: order._id,
      labOrderItemId: labOrderItemId || null,
      status: "ready",
      releasedToPortal: false,
      isSystemGenerated: false,
    });

    if (labOrderItemId) {
      await LabOrderItem.findByIdAndUpdate(labOrderItemId, {
        labReportId: report._id,
        status: "reportReady",
        reportReadyAt: new Date(),
      });
    } else {
      await LabOrderItem.updateMany(
        { labOrderId: order._id },
        { $set: { status: "reportReady", reportReadyAt: new Date() } }
      );
    }

    order.status = "reportReady";
    order.reportReadyAt = new Date();
    await order.save();

    res.status(201).json({
      success: true,
      message: "Lab report uploaded successfully.",
      data: report,
      order: await formatOrder(await LabOrder.findById(order._id).populate(orderPopulate)),
    });

    if (user?.email && req.user.role !== "patient") {
      const frontendBase = process.env.FRONTEND_URL || "https://medisphere.tech";
      const reportUrl = `${frontendBase}/patient/lab-reports`;
      const emailPayload = buildLabReportReadyTemplate({
        name: user.name,
        reportName: report.reportName,
        reportUrl,
      });
      await sendEmail(user.email, emailPayload.subject, emailPayload.text, emailPayload.html);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const downloadLabReportPdf = async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Lab report not found." });
    }

    if (report.reportFile && report.reportFile !== "generated" && !report.isSystemGenerated) {
      return res.redirect(report.reportFile);
    }

    const labOrder = report.labOrderId
      ? await LabOrder.findById(report.labOrderId).populate(orderPopulate)
      : null;
    if (!labOrder) {
      return res.status(400).json({ message: "Lab order not found for this report." });
    }

    if (req.user?.role === "patient") {
      const visible = getPublicReportVisibility({
        report,
        orderPaymentStatus: labOrder.paymentStatus,
        orderReleasedToPortal: labOrder.releasedToPortal,
      });
      if (!visible) {
        return res.status(403).json({ message: "Report is not available yet." });
      }
    }

    if (req.user?.role && !EMPLOYEE_ROLES.includes(req.user.role) && req.user.role !== "patient") {
      return res.status(403).json({ message: "Access forbidden." });
    }

    const items = await LabOrderItem.find({ labOrderId: labOrder._id }).sort({ createdAt: 1 });
    const settings = await HospitalSettings.findOne({ isActive: true }).sort({ updatedAt: -1 });
    const apiBase = process.env.BACKEND_URL || "http://localhost:3500/api";
    const downloadUrl = `${apiBase}/lab-reports/${report._id}/pdf`;
    await generateLabReportPDF({ res, report, labOrder, items, downloadUrl, settings: settings || {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const attachDownloadUrl = (report) => {
  if (!report) return report;
  const reportFile = report.reportFile;
  const hasFile = reportFile && reportFile !== "generated" && !report.isSystemGenerated;
  return {
    ...report,
    downloadUrl: hasFile ? reportFile : `/api/lab-reports/${report._id}/pdf`,
  };
};

export const getPatientReports = async (req, res) => {
  try {
    const { patient } = await ensurePatientProfileForUser(req.user.id);
    const reports = await LabReport.find({ patientId: patient._id })
      .populate("doctorId")
      .populate("appointmentId")
      .populate("labOrderId");

    const data = reports.filter((report) => {
      if (!report.labOrderId) {
        return true;
      }
      return getPublicReportVisibility({
        report,
        orderPaymentStatus: report.labOrderId?.paymentStatus,
        orderReleasedToPortal: report.labOrderId?.releasedToPortal,
      });
    });

    res.status(200).json({
      success: true,
      data: data.map((report) => attachDownloadUrl(report.toObject())),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getReportByPatientId = async (req, res) => {
  try {
    const { patient } = await resolvePatientContext(req.params.patientId);
    const reports = await LabReport.find({ patientId: patient._id })
      .populate("doctorId")
      .populate("appointmentId")
      .populate("labOrderId");

    res.status(200).json({
      success: true,
      data: reports.map((report) => attachDownloadUrl(report.toObject())),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
