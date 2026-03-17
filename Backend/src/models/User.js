import mongoose from "mongoose";
import { ALL_ROLES } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: false,
    },

    role: {
      type: String,
      enum: ALL_ROLES,
      required: true,
    },

    firstName: String,
    middleName: String,
    lastName: String,
    phone: String,
    alternativeContact: String,
    bloodGroup: String,
    city: String,
    state: String,
    postalCode: String,
    gender: String,
    address: String,
    maritalStatus: String,
    nationality: String,
    profileImage: String,

    // Emergency Contact
    emergencyContactName: String,
    emergencyContactPhone: String,
    emergencyContactRelationship: String,

    // Additional fields for Login/Recovery flows
    patientId: {
      type: String,
      unique: true,
      sparse: true, // Allows nulls/undefined for non-patient users
      uppercase: true,
      trim: true,
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Allows nulls/undefined for patient users
      uppercase: true,
      trim: true,
    },

    pin: {
      type: String, // Hashed 4-digit PIN for phone login
    },
    dob: {
      type: Date, // Date of birth for account recovery
    },
    loginOtp: {
      code: String,
      expiresAt: Date,
    },
    resetPasswordOtp: {
      code: String,
      expiresAt: Date,
    },

    // Hierarchy tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    onboardingStatus: {
      type: String,
      enum: ["invited", "active", "suspended", "passwordResetPending", "profileIncomplete"],
      default: "active",
    },

    mustResetPassword: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);

