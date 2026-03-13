import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ["patient", "employee"],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    roleTarget: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    read: {
      type: Boolean,
      default: false,
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

notificationSchema.index(
  { recipientType: 1, recipientId: 1, roleTarget: 1, key: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("Notification", notificationSchema);
