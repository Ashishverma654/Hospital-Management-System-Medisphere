import mongoose from "mongoose";
import { LAB_ORDER_STATUSES, LAB_ORDER_URGENCY, ORDER_PAYMENT_STATUSES } from "../constants/modelEnums.js";

const structuredScheduleSchema = new mongoose.Schema(
  {
    date: String,
    time: String,
    scheduledAt: Date,
    notes: String,
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedAt: Date,
  },
  { _id: false }
);

const labOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
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
      default: "ordered",
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
    sampleCollectionSchedule: structuredScheduleSchema,
    reportPickupSchedule: structuredScheduleSchema,
    sampleCollectionAt: Date,
    sampleCollectedAt: Date,
    accessionedAt: Date,
    accessionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processingStartedAt: Date,
    reportReadyAt: Date,
    reportPickupAt: Date,
    reportReleasedAt: Date,
    completedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    rejectionNotes: String,
    cancelledAt: Date,
    paymentCompletedAt: Date,
    releasedToPortal: {
      type: Boolean,
      default: false,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    notes: String,
  },
  { timestamps: true }
);

labOrderSchema.pre("save", function assignOrderNumber() {
  if (!this.orderNumber) {
    const stamp = Date.now().toString().slice(-8);
    this.orderNumber = `LAB-${stamp}`;
  }

  if (this.sampleCollectionSchedule?.scheduledAt) {
    this.sampleCollectionAt = this.sampleCollectionSchedule.scheduledAt;
  }

  if (this.reportPickupSchedule?.scheduledAt) {
    this.reportPickupAt = this.reportPickupSchedule.scheduledAt;
  }
});

export default mongoose.model("LabOrder", labOrderSchema);
