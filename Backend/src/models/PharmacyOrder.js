import mongoose from "mongoose";
import { ORDER_PAYMENT_STATUSES, PHARMACY_ITEM_STATUSES, PHARMACY_ORDER_STATUSES } from "../constants/modelEnums.js";

const pharmacyOrderItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: false,
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    prescriptionMedicineIndex: {
      type: Number,
      default: 0,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    fulfilledQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unavailableQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    fulfillmentStatus: {
      type: String,
      enum: PHARMACY_ITEM_STATUSES,
      default: "orderPlaced",
    },
    stockAvailableAtReview: {
      type: Number,
      default: 0,
    },
    substitution: {
      originalMedicineName: String,
      substitutedMedicineName: String,
      reason: String,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      substitutedAt: Date,
    },
  },
  { _id: false }
);

const pharmacyOrderSchema = new mongoose.Schema(
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
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    pharmacistUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    status: {
      type: String,
      enum: PHARMACY_ORDER_STATUSES,
      default: "prescribed",
    },
    paymentStatus: {
      type: String,
      enum: ORDER_PAYMENT_STATUSES,
      default: "pending",
    },
    items: [pharmacyOrderItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    orderedAt: {
      type: Date,
      default: Date.now,
    },
    placedAt: Date,
    acceptedAt: Date,
    preparingAt: Date,
    readyAt: Date,
    completedAt: Date,
    dispensedAt: Date,
    cancelledAt: Date,
    lastStatusUpdatedAt: Date,
    notes: String,
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verificationNotes: String,
    counselingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

pharmacyOrderSchema.pre("save", function computeTotals() {
  this.subtotal = Array.isArray(this.items)
    ? this.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
    : 0;
  this.total = this.subtotal;
  this.lastStatusUpdatedAt = new Date();
});

export default mongoose.model("PharmacyOrder", pharmacyOrderSchema);
