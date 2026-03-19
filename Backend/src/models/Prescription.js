import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medicine",
  },
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

  quantity: {
    type: Number
  },

  unit: {
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

    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    diagnosis: {
      type: String,
    },

    clinicalNotes: {
      type: String,
    },

    advice: {
      type: String,
    },

    medicines: [medicineSchema],

    notes: {
      type: String,
    },

    // Follow-up and admission
    followUpDate: {
      type: Date,
    },

    revisitRecommended: {
      type: Boolean,
      default: false,
    },

    admissionRecommended: {
      type: Boolean,
      default: false,
    },

    admissionRecommendationNotes: {
      type: String,
    },

    status: {
      type: String,
      enum: ["draft", "active", "dispensed", "cancelled"],
      default: "active",
    },

    pharmacyOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmacyOrder",
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },

  { timestamps: true },
);

export default mongoose.model("Prescription", prescriptionSchema);
