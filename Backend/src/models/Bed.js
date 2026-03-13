import mongoose from "mongoose";
import { BED_STATUSES, WARD_TYPES } from "../constants/modelEnums.js";

const bedSchema = new mongoose.Schema({
    bedNumber: {
        type: String,
        required: true,
        unique: true
    },

    ward: {
        type: String,
    },

    wardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ward"
    },

    type: {
        type: String,
        enum: WARD_TYPES,
        default: "general"
    },

    status: {
        type: String,
        enum: BED_STATUSES,
        default: "available"
    },

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    patientProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    },

    admittedAt: {
        type: Date
    },

    dischargedAt: {
        type: Date
    },

    customPriceOverride: {
        type: Number,
        min: 0
    },

    isActive: {
        type: Boolean,
        default: true
    }

},
    { timestamps: true }
);

export default mongoose.model("Bed", bedSchema);
