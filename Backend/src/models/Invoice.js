import mongoose from "mongoose";
import { BILL_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES } from "../constants/modelEnums.js";

const invoiceLineItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    referenceType: {
      type: String,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
    },
  },
  { _id: false }
);

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      min: 0,
      required: true,
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        unique: true,
        sparse: true
    },

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },

    patientUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment"
    },

    labOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabOrder"
    },

    pharmacyOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PharmacyOrder"
    },

    bedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bed"
    },

    wardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ward"
    },

    billType: {
        type: String,
        enum: BILL_TYPES,
        default: "mixed"
    },

    lineItems: [invoiceLineItemSchema],

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

    subtotal: {
        type: Number,
        default: 0
    },

    paymentStatus: {
        type: String,
        enum: PAYMENT_STATUSES,
        default: "pending",
    },

    paymentMethod: {
        type: String,
        enum: PAYMENT_METHODS
    },

    paidAt: {
        type: Date
    },

    paymentHistory: [paymentHistorySchema],

    discount: {
        amount: {
            type: Number,
            min: 0
        },
        reason: {
            type: String
        }
    },

    insuranceCoverage: {
        provider: {
            type: String
        },
        amount: {
            type: Number,
            min: 0
        },
        policyNumber: {
            type: String
        }
    },

    notes: {
        type: String
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},
    { timestamps: true }
);

invoiceSchema.pre("save", function computeTotals() {
    if (!this.invoiceNumber) {
        const stamp = Date.now().toString().slice(-8);
        const suffix = Math.floor(100 + Math.random() * 900);
        this.invoiceNumber = `INV-${stamp}-${suffix}`;
    }

    const legacySubtotal = (this.doctorFee || 0) + (this.labCharges || 0) + (this.medicineCharges || 0) + (this.otherCharges || 0);
    const lineItemSubtotal = Array.isArray(this.lineItems)
        ? this.lineItems.reduce((sum, item) => sum + (item.lineTotal || (item.quantity || 0) * (item.unitPrice || 0)), 0)
        : 0;

    this.subtotal = lineItemSubtotal || legacySubtotal;
    this.totalAmount = this.subtotal;
});

export default mongoose.model("Invoice", invoiceSchema);
