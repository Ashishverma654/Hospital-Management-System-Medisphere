import mongoose from "mongoose";

const staffDutySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["onDuty", "offDuty", "leave", "holiday"],
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    shiftType: {
      type: String,
    },
    isManualOverride: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true }
);

staffDutySchema.index({ userId: 1, status: 1, date: 1 });

export default mongoose.model("StaffDuty", staffDutySchema);
