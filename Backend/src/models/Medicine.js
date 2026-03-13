import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    manufacturer: {
        type: String
    },

    category: {
        type: String
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },

    stock: {
        type: Number,
        required: true,
        min: 0
    },

    lowStockThreshold: {
        type: Number,
        default: 10,
        min: 0
    },

    unit: {
        type: String,
        default: "unit"
    },

    isActive: {
        type: Boolean,
        default: true
    },

    expiryDate: {
        type: Date
    },

    supplier: {
        type: String
    },

    batchNumber: {
        type: String
    }
},
    { timestamps: true }
);

medicineSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Medicine", medicineSchema);

