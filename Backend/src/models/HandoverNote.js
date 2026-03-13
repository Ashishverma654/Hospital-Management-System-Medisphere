import mongoose from "mongoose";
import { HANDOVER_PRIORITIES } from "../constants/modelEnums.js";

const handoverNoteSchema = new mongoose.Schema(
  {
    fromNurseUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toNurseUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: HANDOVER_PRIORITIES,
      default: "medium",
    },
    summary: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("HandoverNote", handoverNoteSchema);
