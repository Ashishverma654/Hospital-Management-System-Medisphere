import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    manufacturer: {
        type: String
    },

    category: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },

    stock: {
        type: Number,
        required: true
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

export default mongoose.model("Medicine", medicineSchema);

