import mongoose from "mongoose";
import { NURSING_TASK_STATUSES } from "../constants/modelEnums.js";

const nursingTaskSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    nurseUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
    },
    taskType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: NURSING_TASK_STATUSES,
      default: "pending",
    },
    dueAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("NursingTask", nursingTaskSchema);
