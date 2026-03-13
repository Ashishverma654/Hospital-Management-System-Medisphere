import mongoose from "mongoose";
import { ALL_ROLES } from "../constants/roles.js";

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorName: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      enum: ALL_ROLES,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ actorId: 1, action: 1, entityType: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
