import mongoose from "mongoose";

const labTechnicianSchema = new mongoose.Schema(
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
    labSection: {
      type: String, // e.g., "Pathology", "Radiology", "Microbiology"
    },
    certifications: [
      {
        type: String,
      },
    ],
    qualifications: [String],
    education: [String],
    joiningDate: Date,
    experienceYears: {
      type: Number,
      default: 0,
    },
    about: String,
    skills: [String],
    licenseNumber: String,
    licenseExpiryDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LabTechnician", labTechnicianSchema);
