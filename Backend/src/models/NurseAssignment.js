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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    history: [
      {
        action: { type: String, required: true },
        performedBy: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: String,
          role: String,
        },
        details: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

nurseAssignmentSchema.index({ nurseUserId: 1 });
nurseAssignmentSchema.index({ wardId: 1 });
nurseAssignmentSchema.index({ shiftId: 1 });

export default mongoose.model("NurseAssignment", nurseAssignmentSchema);
