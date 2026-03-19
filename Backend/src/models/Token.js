import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Waiting", "In Consultation", "Completed"],
      default: "Waiting",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

tokenSchema.index({ appointmentId: 1 }, { unique: true });
tokenSchema.index({ doctorId: 1, date: 1, tokenNumber: 1 });
tokenSchema.index({ doctorId: 1, date: 1 });

export default mongoose.model("Token", tokenSchema);
