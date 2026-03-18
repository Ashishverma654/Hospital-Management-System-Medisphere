import mongoose from "mongoose";
import { WARD_TYPES, CLEANING_STATUSES } from "../constants/modelEnums.js";

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
    wardCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    wardType: {
      type: String,
      enum: WARD_TYPES,
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
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
    occupiedBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    defaultPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    wardInCharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    nurseCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    equipment: [{
      type: String,
      trim: true,
    }],
    cleaningStatus: {
      type: String,
      enum: CLEANING_STATUSES,
      default: "clean",
    },
    lastSanitized: {
      type: Date,
    },
    contactNumber: {
      type: String,
      trim: true,
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
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

wardSchema.virtual("availableBeds").get(function () {
  return Math.max(0, (this.bedCount || 0) - (this.occupiedBeds || 0));
});

wardSchema.index({ wardNumber: 1 }, { unique: true });
wardSchema.index({ wardCode: 1 }, { unique: true, sparse: true });

wardSchema.pre("validate", function (next) {
  if (!this.wardCode && this.wardNumber) {
    this.wardCode = this.wardNumber.toUpperCase().replace(/\s+/g, "-");
  }
  if (this.occupiedBeds > this.bedCount) {
    const err = new Error("Occupied beds cannot exceed total bed count.");
    if (typeof next === "function") {
      return next(err);
    }
    throw err;
  }
  if (typeof next === "function") {
    return next();
  }
});

export default mongoose.model("Ward", wardSchema);
