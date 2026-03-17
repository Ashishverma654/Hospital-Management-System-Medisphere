import mongoose from "mongoose";

const pharmacistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
    },
    assignedCounter: {
      type: String,
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night"],
      default: "morning",
    },
    qualifications: [String],
    education: [String],
    certifications: [String],
    licenseExpiryDate: Date,
    joiningDate: Date,
    experienceYears: {
      type: Number,
      default: 0,
    },
    about: String,
    skills: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Pharmacist", pharmacistSchema);
