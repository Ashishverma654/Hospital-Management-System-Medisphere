import mongoose from "mongoose";

const labReportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },

    patientUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
    },

    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
    },

    reportName: {
        type: String,
        required: true
    },

    reportType: {
        type: String
    },

    reportFile: {
        type: String,
        required: true,
    },

    filePublicId: {
        type: String,
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    labOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabOrder",
    },

    labOrderItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabOrderItem",
    },

    status: {
        type: String,
        enum: ["uploaded", "ready", "released", "archived"],
        default: "uploaded"
    },
    isSystemGenerated: {
        type: Boolean,
        default: false,
    },

    releasedToPortal: {
        type: Boolean,
        default: false
    },

    releasedAt: {
        type: Date,
    },

},
    { timestamps: true }
);

export default mongoose.model("LabReport", labReportSchema);
