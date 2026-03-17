import mongoose from "mongoose";

const nurseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    assignedWard: {
      type: String,
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night"],
      default: "morning",
    },
    specialization: {
      type: String,
    },
    assignedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],
    qualifications: [String],
    education: [String],
    certifications: [String],
    licenseNumber: String,
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

export default mongoose.model("Nurse", nurseSchema);
