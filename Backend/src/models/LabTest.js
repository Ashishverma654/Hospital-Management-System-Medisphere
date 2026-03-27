import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    testType: {
      type: String,
      enum: ["BLOOD", "RADIOLOGY", "PATHOLOGY", "OTHER"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

labTestSchema.index({ name: 1, testType: 1 });

export default mongoose.model("LabTest", labTestSchema);
