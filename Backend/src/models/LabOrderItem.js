import mongoose from "mongoose";
import { LAB_ITEM_STATUSES } from "../constants/modelEnums.js";

const labOrderItemSchema = new mongoose.Schema(
  {
    labOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabOrder",
      required: true,
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
      default: "pending",
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
  },
  { timestamps: true }
);

export default mongoose.model("LabOrderItem", labOrderItemSchema);
