import mongoose from "mongoose";

const bedSchema = new mongoose.Schema({
    bedNumber: {
        type: String,
        required: true,
        unique: true
    },

    ward: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["general", "semi-private", "private", "icu"],
        default: "general"
    },

    status: {
        type: String,
        enum: ["available", "occupied", "maintenance"],
        default: "available"
    },

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    },

    admittedAt: {
        type: Date
    },

    dischargedAt: {
        type: Date
    }

},
    { timestamps: true }
);

export default mongoose.model("Bed", bedSchema);
