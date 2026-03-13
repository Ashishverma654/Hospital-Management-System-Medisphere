import mongoose from "mongoose";
import { LAB_ORDER_STATUSES, LAB_ORDER_URGENCY, ORDER_PAYMENT_STATUSES } from "../constants/modelEnums.js";

const labOrderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    status: {
      type: String,
      enum: LAB_ORDER_STATUSES,
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ORDER_PAYMENT_STATUSES,
      default: "pending",
    },
    urgency: {
      type: String,
      enum: LAB_ORDER_URGENCY,
      default: "routine",
    },
    sampleCollectionAt: Date,
    reportPickupAt: Date,
    releasedToPortal: {
      type: Boolean,
      default: false,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("LabOrder", labOrderSchema);
