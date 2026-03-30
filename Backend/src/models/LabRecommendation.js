import mongoose from "mongoose";

const labRecommendationSchema = new mongoose.Schema(
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
    tests: [
      {
        testId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LabTest",
        },
        testType: String,
        testName: String,
        testCode: String,
        price: Number,
      },
    ],
    urgency: {
      type: String,
      default: "routine",
    },
    notes: String,
    status: {
      type: String,
      enum: ["recommended", "ordered", "external", "cancelled"],
      default: "recommended",
    },
    labOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabOrder",
    },
    externalNotes: String,
    orderedAt: Date,
    declinedAt: Date,
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("LabRecommendation", labRecommendationSchema);
