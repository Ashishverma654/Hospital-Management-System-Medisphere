import mongoose from "mongoose";

const hospitalLocationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    mapUrl: {
       type: String,
    },
    locationType: {
      type: String,
      enum: ["hospital", "clinic", "lab", "pharmacy", "other"],
      default: "hospital",
    },
    isMediclinic: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
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

export default mongoose.model("HospitalLocation", hospitalLocationSchema);
