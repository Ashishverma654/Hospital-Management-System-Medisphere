import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },

    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment"
    },

    daysConsulted: {
        type: Number,
        default: 1
    },

    medicinesBreakdown: [{
        name: String,
        price: Number
    }],

    labReportsBreakdown: [{
        reportName: String,
        price: Number
    }],

    doctorFee: {
        type: Number,
        default: 0
    },

    labCharges: {
        type: Number,
        default: 0
    },

    medicineCharges: {
        type: Number,
        default: 0
    },

    otherCharges: {
        type: Number,
        default: 0
    },

    totalAmount: {
        type: Number
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending",
    },

    paymentMethod: {
        type: String,
        enum: ["cash", "card", "upi"]
    },

    paidAt: {
        type: Date
    }
},
    { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);