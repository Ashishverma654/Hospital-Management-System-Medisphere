import mongoose from "mongoose";

const medicineStockLogSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    changeType: {
      type: String,
      enum: ["initial", "restock", "adjustment", "sale", "return", "expired", "correction"],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    performedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    performedByName: {
      type: String,
    },
    performedByRole: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

medicineStockLogSchema.index({ medicineId: 1, createdAt: -1 });

export default mongoose.model("MedicineStockLog", medicineStockLogSchema);
