import Bed from "../models/Bed.js";
import { resolvePatientContext } from "../utils/patientContext.js";

export const addBed = async (req, res) => {
    try {

        const bed = new Bed(req.body);

        await bed.save();

        res.status(201).json({
            success: true,
            message: "Bed created",
            data: bed
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



// GET ALL BEDS
export const getBeds = async (req, res) => {
    try {

        const beds = await Bed.find().populate("patientId").populate({ path: "patientProfileId", populate: { path: "userId", select: "name email patientId" } });

        res.status(200).json({
            success: true,
            data: beds
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



// ASSIGN BED (ADMIT PATIENT)
export const assignBed = async (req, res) => {
    try {

        const bed = await Bed.findById(req.params.id);

        if (!bed) {
            return res.status(404).json({
                success: false,
                message: "Bed not found"
            });
        }

        if (bed.status === "occupied") {
            return res.status(400).json({
                success: false,
                message: "Bed already occupied"
            });
        }

        const { patient, user } = await resolvePatientContext(req.body.patientId);

        bed.status = "occupied";
        bed.patientId = user._id;
        bed.patientProfileId = patient._id;
        bed.admittedAt = new Date();

        await bed.save();

        res.status(200).json({
            success: true,
            message: "Patient admitted",
            data: bed
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



// DISCHARGE PATIENT
export const dischargePatient = async (req, res) => {
    try {

        const bed = await Bed.findById(req.params.id);

        if (!bed) {
            return res.status(404).json({
                success: false,
                message: "Bed not found"
            });
        }

        bed.status = "available";
        bed.patientId = null;
        bed.patientProfileId = null;
        bed.dischargedAt = new Date();

        await bed.save();

        res.status(200).json({
            success: true,
            message: "Patient discharged",
            data: bed
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
