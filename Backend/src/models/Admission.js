import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dischargedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    dischargeDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Admitted", "Discharged", "Transferred"],
      default: "Admitted",
    },
    reason: {
      type: String,
    },
    notes: {
      type: String,
    },
    transferHistory: [
      {
        fromWardId: { type: mongoose.Schema.Types.ObjectId, ref: "Ward" },
        toWardId: { type: mongoose.Schema.Types.ObjectId, ref: "Ward" },
        fromBedId: { type: mongoose.Schema.Types.ObjectId, ref: "Bed" },
        toBedId: { type: mongoose.Schema.Types.ObjectId, ref: "Bed" },
        transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        transferredAt: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

admissionSchema.index({ patientId: 1 });
admissionSchema.index({ wardId: 1 });
admissionSchema.index({ bedId: 1 });

export default mongoose.model("Admission", admissionSchema);
