import mongoose from "mongoose";
import { SHIFT_TYPES } from "../constants/modelEnums.js";

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    shiftType: {
      type: String,
      enum: SHIFT_TYPES,
      default: "custom",
    },
    code: {
      type: String,
    },
    description: {
      type: String,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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
  { timestamps: true }
);

export default mongoose.model("Shift", shiftSchema);
