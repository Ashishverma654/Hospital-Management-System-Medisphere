import mongoose from "mongoose";

const vitalsSchema = new mongoose.Schema(
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
    nurseUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    temperature: Number,
    pulse: Number,
    respirationRate: Number,
    systolicBp: Number,
    diastolicBp: Number,
    spo2: Number,
    bloodSugar: Number,
    weight: Number,
    notes: String,
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vitals", vitalsSchema);
