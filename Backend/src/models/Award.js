import mongoose from "mongoose";
import { AWARD_TYPES } from "../constants/modelEnums.js";

const awardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: AWARD_TYPES,
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    title: {
      type: String,
      required: true,
    },
    organization: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Award", awardSchema);
