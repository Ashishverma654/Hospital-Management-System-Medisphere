import mongoose from "mongoose";
import { WARD_TYPES } from "../constants/modelEnums.js";

const wardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    wardNumber: {
      type: String,
      required: true,
      trim: true,
    },
    wardType: {
      type: String,
      enum: WARD_TYPES,
      required: true,
    },
    floor: {
      type: String,
    },
    block: {
      type: String,
    },
    hospitalLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalLocation",
    },
    bedCount: {
      type: Number,
      required: true,
      min: 0,
    },
    defaultPrice: {
      type: Number,
      default: 0,
      min: 0,
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

wardSchema.index({ wardNumber: 1 }, { unique: true });

export default mongoose.model("Ward", wardSchema);
