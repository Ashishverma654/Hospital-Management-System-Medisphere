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
    admissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admission"
    },

    admittedAt: {
        type: Date
    },

    dischargedAt: {
        type: Date
    },

    admissionHistory: [
        {
            patientId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            patientProfileId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Patient"
            },
            doctorId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Doctor"
            },
            prescriptionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Prescription"
            },
            admissionRecommended: {
                type: Boolean,
                default: false
            },
            admissionRecommendationNotes: {
                type: String
            },
            admittedAt: {
                type: Date
            },
            dischargedAt: {
                type: Date
            },
            admittedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            dischargedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            status: {
                type: String,
                enum: ["admitted", "discharged"],
                default: "admitted"
            }
        }
    ],

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
