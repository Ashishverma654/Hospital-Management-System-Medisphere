import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    mutedTypes: {
      type: [String],
      default: [],
    },
    mutedPriorities: {
      type: [String],
      default: [],
    },
    muteAll: {
      type: Boolean,
      default: false,
    },
    allowUrgentSound: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("NotificationPreference", notificationPreferenceSchema);
