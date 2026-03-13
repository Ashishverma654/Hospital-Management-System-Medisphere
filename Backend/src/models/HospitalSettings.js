import mongoose from "mongoose";

const hospitalSettingsSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    emergencyNumber: {
      type: String,
    },
    footerInfo: {
      type: String,
    },
    publicInfo: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("HospitalSettings", hospitalSettingsSchema);
