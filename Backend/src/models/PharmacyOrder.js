import mongoose from "mongoose";
import { ORDER_PAYMENT_STATUSES, ORDER_STATUSES } from "../constants/modelEnums.js";

const pharmacyOrderItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
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
      enum: ORDER_STATUSES,
      default: "pending",
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
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
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
    acceptedAt: Date,
    readyAt: Date,
    completedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

pharmacyOrderSchema.pre("save", function computeTotals(next) {
  this.subtotal = Array.isArray(this.items)
    ? this.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
    : 0;
  this.total = this.subtotal;
  next();
});

export default mongoose.model("PharmacyOrder", pharmacyOrderSchema);
