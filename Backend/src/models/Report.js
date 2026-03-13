import mongoose from "mongoose";
const reportSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    patientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    reportUrl: {
      type: String,
      required: true,
    },

    reportName: String,

    status: {
      type: String,
      enum: ["uploaded", "reviewed", "released", "archived"],
      default: "uploaded",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Report", reportSchema);
