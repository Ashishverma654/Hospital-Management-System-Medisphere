import Patient from "../models/Patient.js";

export const createPatient = async (req, res) => {
    try {
        const patient = new Patient(req.body);

        await patient.save();
        res.status(201).json({
            success: true,
            message: "Patient Profile Created.",
            data: patient
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find().populate("userId");

        res.status(200).json({
            success: true,
            data: patients
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


export const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).populate("userId");

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not Found."
            });
        }

        res.status(200).json({
            success: true,
            data: patient
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true
            }
        );

        res.status(200).json({
            success: true,
            message: "Patient Updated",
            data: patient
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};