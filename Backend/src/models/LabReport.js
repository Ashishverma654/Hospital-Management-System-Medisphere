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
        enum: ["uploaded", "reviewed", "released", "archived"],
        default: "uploaded"
    },

    releasedToPortal: {
        type: Boolean,
        default: true
    },

},
    { timestamps: true }
);

export default mongoose.model("LabReport", labReportSchema);
