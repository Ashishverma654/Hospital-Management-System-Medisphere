import mongoose from "mongoose";
import { APPOINTMENT_STATUSES } from "../constants/modelEnums.js";

const appointmentSchema = new mongoose.Schema(
  {
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

    patientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },

    doctorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    hospitalLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalLocation",
    },

    date: {
      type: String,
      required: true,
    },

    slot: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: "booked",
    },

    reasonForVisit: {
      type: String,
    },

    consultationMode: {
      type: String,
      enum: ["in-person", "video", "phone"],
      default: "in-person",
    },

    notes: {
      type: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

appointmentSchema.index({ doctorId: 1, date: 1, slot: 1 }, { unique: true });

export default mongoose.model("Appointment", appointmentSchema);
