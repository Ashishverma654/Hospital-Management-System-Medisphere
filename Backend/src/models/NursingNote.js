import mongoose from "mongoose";
import { NURSING_NOTE_TYPES } from "../constants/modelEnums.js";

const nursingNoteSchema = new mongoose.Schema(
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
    noteType: {
      type: String,
      enum: NURSING_NOTE_TYPES,
      default: "general",
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("NursingNote", nursingNoteSchema);
