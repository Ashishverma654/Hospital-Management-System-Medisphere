import mongoose from "mongoose";

const healthPackageSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    includedServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiagnosticService",
      },
    ],
    includedDetails: [
       {
         type: String, // e.g. "Full body checkup", "CBC", "Lipid Profile"
       }
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("HealthPackage", healthPackageSchema);
