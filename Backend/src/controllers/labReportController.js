import LabOrder from "../models/LabOrder.js";
import LabOrderItem from "../models/LabOrderItem.js";
import LabReport from "../models/LabReport.js";
import { sendEmail } from "../utils/sendEmail.js";
import { ensurePatientProfileForUser, resolvePatientContext } from "../utils/patientContext.js";
import { getPublicReportVisibility } from "../utils/labWorkflow.js";
import { formatOrder, orderPopulate, syncLabOrderPaymentState } from "./labOrderController.js";

export const uploadLabReport = async (req, res) => {
  try {
    const { labOrderId: requestedLabOrderId, labOrderItemId, reportName, reportType, patientId, doctorId, appointmentId } = req.body;
    const labOrderId = requestedLabOrderId || req.params.id;

    if (!req.file?.path) {
      return res.status(400).json({ message: "Report file is required." });
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
      await sendEmail(
        user.email,
        "Lab Report Ready",
        "Your diagnostic report is prepared internally. It will appear in the patient portal after release and payment confirmation."
      );
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
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
      data,
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
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
