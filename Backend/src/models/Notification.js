import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    key: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "general",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    readAt: {
      type: Date,
    },
    sourceType: {
      type: String,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, key: 1 }, { unique: true });

export default mongoose.model("Notification", notificationSchema);
