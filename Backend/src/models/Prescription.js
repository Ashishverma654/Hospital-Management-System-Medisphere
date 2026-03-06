import mongoose, { Types } from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    diagnosis: {
      type: String,
    },

    medicines: [
      {
        name: String,
        dosage: String,
        duration: String,
      },
    ],

    notes: {
      type: String,
    },
  },

  { timestamps: true },
);

export default mongoose.model("Prescription", prescriptionSchema);
