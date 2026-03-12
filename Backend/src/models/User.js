import mongoose from "mongoose";

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
    },

    password: {
      type: String,
      required: false,
    },

    role: {
      type: String,
      enum: ["superadmin", "admin", "doctor", "patient", "superreceptionist", "receptionist", "nurse", "pharmacist", "labTechnician"],
      required: true,
    },

    phone: String,
    gender: String,
    address: String,
    profileImage: String,
    
    // Additional fields for Login/Recovery flows
    patientId: {
      type: String,
      unique: true,
      sparse: true // Allows nulls/undefined for non-patient users
    },
    
    employeeId: {
      type: String,
      unique: true,
      sparse: true // Allows nulls/undefined for patient users
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
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);

