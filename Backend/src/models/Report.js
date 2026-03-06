import mongoose, { mongo } from "mongoose";
const reportSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  },
  { timestamps: true },
);

export default mongoose.model("Report", reportSchema);
