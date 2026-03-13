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
  },
  { timestamps: true }
);

export default mongoose.model("Shift", shiftSchema);
