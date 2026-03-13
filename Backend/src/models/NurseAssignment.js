import mongoose from "mongoose";

const nurseAssignmentSchema = new mongoose.Schema(
  {
    nurseUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
    assignmentStart: {
      type: Date,
      required: true,
    },
    assignmentEnd: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("NurseAssignment", nurseAssignmentSchema);
