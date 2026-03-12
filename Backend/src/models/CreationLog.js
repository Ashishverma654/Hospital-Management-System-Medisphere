import mongoose from "mongoose";

const creationLogSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorName: {
      type: String,
      required: true,
    },
    creatorRole: {
      type: String,
      required: true,
    },
    createdUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdUserName: {
      type: String,
      required: true,
    },
    createdUserEmail: {
      type: String,
      required: true,
    },
    createdUserRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ["created", "deactivated", "reactivated", "updated"],
      default: "created",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CreationLog", creationLogSchema);
