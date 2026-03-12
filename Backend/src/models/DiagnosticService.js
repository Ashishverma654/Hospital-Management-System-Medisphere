import mongoose from "mongoose";

const diagnosticServiceSchema = mongoose.Schema(
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
    type: {
      type: String,
      enum: ["X-Ray", "MRI", "CT", "ECHO", "Lab Test", "Other"],
      required: true,
    },
    preparationInstructions: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("DiagnosticService", diagnosticServiceSchema);
