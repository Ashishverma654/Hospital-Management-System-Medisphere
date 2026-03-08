import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  dosage: {
    type: String
  },

  frequency: {
    type: String
  },

  duration: {
    type: String
  },

  instructions: {
    type: String
  },
});


const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    diagnosis: {
      type: String,
    },

    medicines: [medicineSchema],

    notes: {
      type: String,
    },
  },

  { timestamps: true },
);

export default mongoose.model("Prescription", prescriptionSchema);
