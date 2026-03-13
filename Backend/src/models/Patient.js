import mongoose from "mongoose";
import { BLOOD_GROUPS } from "../constants/modelEnums.js";

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    medicalRecordNumber: {
        type: String,
        unique: true,
        sparse: true
    },

    dateOfBirth: {
        type: Date
    },

    age: {
        type: Number,
        min: 0
    },

    bloodGroup: {
        type: String,
        enum: BLOOD_GROUPS,
        alias: "loadGroup"
    },

    height: {
        type: Number
    },

    weight: {
        type: Number
    },

    gender: {
        type: String,
        enum: ["male", "female", "other", "unknown"],
        default: "unknown"
    },

    maritalStatus: {
        type: String,
        enum: ["single", "married", "divorced", "widowed", "other"]
    },

    allergies: [{
        type: String
    }],

    chronicDiseases: [{
        type: String
    }],

    primaryDoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor"
    },

    hospitalLocationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HospitalLocation"
    },

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

    profileStatus: {
        type: String,
        enum: ["incomplete", "active", "archived"],
        default: "active"
    },

    notes: {
        type: String
    },

    isActive: {
        type: Boolean,
        default: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
},
    { timestamps: true }
);

patientSchema.index({ userId: 1 }, { unique: true });
patientSchema.index({ medicalRecordNumber: 1 }, { sparse: true, unique: true });

export default mongoose.model("Patient", patientSchema);
