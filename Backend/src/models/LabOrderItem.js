import mongoose from "mongoose";
import { LAB_ITEM_STATUSES } from "../constants/modelEnums.js";

const labOrderItemSchema = new mongoose.Schema(
  {
    labOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabOrder",
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTest",
    },
    testType: {
      type: String,
      enum: ["BLOOD", "RADIOLOGY", "PATHOLOGY", "OTHER"],
    },
    diagnosticServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticService",
    },
    testName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: LAB_ITEM_STATUSES,
      default: "ordered",
    },
    remarks: String,
    price: {
      type: Number,
      default: 0,
    },
    labReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabReport",
    },
    sampleCollectedAt: Date,
    accessionedAt: Date,
    accessionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processingStartedAt: Date,
    reportReadyAt: Date,
    reportReleasedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    isCriticalResult: {
      type: Boolean,
      default: false,
    },
    criticalNotes: String,
    resultValue: String,
    resultUnit: String,
    referenceRange: String,
    resultNotes: String,
  },
  { timestamps: true }
);

export default mongoose.model("LabOrderItem", labOrderItemSchema);
