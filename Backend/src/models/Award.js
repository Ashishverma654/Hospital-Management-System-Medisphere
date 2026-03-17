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
    category: {
      type: String,
      enum: ["Hospital Excellence", "Doctor Achievement", "Patient Care", "Innovation", "Accreditation"],
      required: true,
    },
    organization: {
      type: String,
      required: true,
    },
    issuedByType: {
      type: String,
      enum: ["Government", "Private Organization", "International Body"],
      required: true,
    },
    awardDate: {
      type: Date,
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HospitalLocation",
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    certificateUrl: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Hidden"],
      default: "Active",
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

export default mongoose.model("Award", awardSchema);
