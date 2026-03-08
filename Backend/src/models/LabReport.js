import mongoose, { mongo } from "mongoose";

const labReportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
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

},
    { timestamps: true }
);

export default mongoose.model("LabReport", labReportSchema);