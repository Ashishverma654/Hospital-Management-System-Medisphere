import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    age: {
        type: Number,
        required: true
    },

    loadGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },

    height: {
        type: Number
    },

    weight: {
        type: Number
    },

    allergies: [{
        type: String
    }],

    chronicDiseases: [{
        type: String
    }],

    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    },

    insuranceProvider: {
        type: String
    },

    insuranceNumber: {
        type: String
    },
},
    { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);